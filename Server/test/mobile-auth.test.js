const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup(role = 'USER') {
  const calls = { sessions: 0, mfa: 0, rateChecks: 0, failures: 0 };
  const user = { id: 'member-1', firstName: 'Test', lastName: 'Member', role, email: 'test@example.com', emailVerifiedAt: new Date() };
  const services = {
    '../services/auth.service': { loginUser: async () => user, loginWithGoogleCredential: async () => user },
    '../services/security.service': {
      assertLoginAllowed: async () => { calls.rateChecks++; },
      createSession: async () => { calls.sessions++; return { id: 'session-1' }; },
      recordFailedLogin: async () => { calls.failures++; },
    },
    '../security/admin-mfa': { verifyAdminMfa: async () => ({ user, authMethod: 'PASSWORD_MFA', recoveryCodes: ['TEST-ONE-TIME'] }), beginAdminMfa: async () => { calls.mfa++; return role === 'ADMIN' ? { token: 'challenge', setupRequired: false } : null; } },
    '../utils/generate-token': (u, id) => `signed:${u.id}:${id}`,
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/controllers/auth.controller.js'), 'utf8'), { require: id => { if (!(id in services)) throw Error(id); return services[id]; }, module, exports: module.exports, process: { env: {} }, setTimeout: fn => fn(), setImmediate: fn => fn(), console });
  const res = { statusCode: 200, cookies: [], status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, cookie(name, token) { this.cookies.push({ name, token }); return this; } };
  return { controller: module.exports, res, calls, services, req: { body: { email: user.email, password: 'unused-test-password' } } };
}
test('mobile member login returns a session-bound bearer token without a browser cookie', async () => {
  const { controller, res, req, calls } = setup();
  await controller.mobileLogin(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, 'signed:member-1:session-1');
  assert.equal(res.body.user.role, 'USER');
  assert.equal(res.cookies.length, 0);
  assert.equal(calls.sessions, 1);
  assert.equal(calls.rateChecks, 1);
});
test('website login retains its cookie and never returns the token in JSON', async () => {
  const { controller, res, req } = setup();
  await controller.login(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, undefined);
  assert.equal(res.cookies[0].name, 'fitswap_session');
});
test('mobile owner login creates a normal session without a browser cookie', async () => {
 const { controller, res, req, calls } = setup('GYM_OWNER');
 await controller.mobileLogin(req, res);
 assert.equal(res.statusCode, 200); assert.equal(res.body.user.role, 'GYM_OWNER'); assert.equal(calls.sessions, 1); assert.equal(res.cookies.length, 0);
});
test('mobile administrator login requires MFA before creating a session', async () => {
 const { controller, res, req, calls } = setup('ADMIN');
 await controller.mobileLogin(req, res);
 assert.equal(res.body.mfaRequired, true); assert.equal(res.body.mfaChallengeToken, 'challenge'); assert.equal(res.body.token, undefined); assert.equal(calls.sessions, 0); assert.equal(calls.mfa, 1);
});
test('website administrator login still requires MFA and does not create an early session', async () => {
  const { controller, res, req, calls } = setup('ADMIN');
  await controller.login(req, res);
  assert.equal(res.body.mfaRequired, true);
  assert.equal(res.body.token, undefined);
  assert.equal(calls.sessions, 0);
});
test('failed mobile credentials do not return a token or create a session', async () => {
  const { controller, res, req, calls, services } = setup();
  services['../services/auth.service'].loginUser = async () => { throw new Error('Invalid credentials'); };
  await controller.mobileLogin(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.token, undefined);
  assert.equal(calls.sessions, 0);
  assert.equal(calls.failures, 1);
});
test('a session creation failure returns a server error without leaking credentials', async () => {
  const { controller, res, req, services } = setup();
  services['../services/security.service'].createSession = async () => { throw new Error('private database detail'); };
  await controller.mobileLogin(req, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.token, undefined);
  assert.doesNotMatch(res.body.message, /private database/);
});

test('mobile administrator MFA returns a session-bound token only after verification', async () => {
 const { controller, res, req, calls } = setup('ADMIN');
 await controller.mobileVerifyAdminMfa(req, res);
 assert.equal(res.body.token, 'signed:member-1:session-1'); assert.equal(calls.sessions, 1); assert.equal(res.cookies.length, 0); assert.equal(res.body.recoveryCodes[0], 'TEST-ONE-TIME');
});
test('website MFA retains cookie authentication without exposing a bearer token', async () => {
 const { controller, res, req } = setup('ADMIN'); await controller.verifyAdminMfa(req, res);
 assert.equal(res.body.token, undefined); assert.equal(res.cookies[0].name, 'fitswap_session');
});
test('invalid administrator MFA cannot create a mobile session', async () => {
 const { controller, res, req, calls, services } = setup('ADMIN');
 services['../security/admin-mfa'].verifyAdminMfa = async () => { throw new Error('Invalid MFA code'); };
 await controller.mobileVerifyAdminMfa(req, res);
 assert.equal(res.statusCode, 400); assert.equal(res.body.token, undefined); assert.equal(calls.sessions, 0);
});
test('mobile Google sign-in reuses administrator MFA requirements', async () => {
 const { controller, res, req, calls } = setup('ADMIN'); await controller.mobileGoogleLogin(req, res);
 assert.equal(res.body.mfaRequired, true); assert.equal(res.body.token, undefined); assert.equal(calls.sessions, 0);
});
test('mobile Google member sign-in returns a revocable session token without a cookie', async () => {
 const { controller, res, req, calls } = setup(); await controller.mobileGoogleLogin(req, res);
 assert.equal(res.body.token, 'signed:member-1:session-1'); assert.equal(calls.sessions, 1); assert.equal(res.cookies.length, 0);
});
