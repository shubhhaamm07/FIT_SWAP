const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const ts = require("typescript");
function setup(
  status = 200,
  data = { success: true },
  platform = "android",
  runtime = {},
) {
  const calls = [];
  const saved = new Map();
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/api/client.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mocks = {
    "react-native": { Platform: { OS: platform } },
    "expo-constants": {
      __esModule: true,
      default: { expoConfig: { hostUri: runtime.hostUri } },
    },
    "../utils/endpoints.cjs": require("../src/utils/endpoints.cjs"),
    "expo-secure-store": {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
      getItemAsync: async (key) => saved.get(key),
      setItemAsync: async (key, value) => saved.set(key, value),
      deleteItemAsync: async (key) => saved.delete(key),
    },
    "../utils/demo": { demoData: () => ({ data: ["sample"] }) },
  };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (id) => mocks[id],
    process: { env: runtime.env || {} },
    __DEV__: true,
    window: runtime.browserOrigin
      ? { location: { origin: runtime.browserOrigin } }
      : undefined,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => data,
      };
    },
    AbortController,
    FormData,
    Blob,
    URLSearchParams,
    URL,
    setTimeout,
    clearTimeout,
    console,
  });
  return { client: module.exports, calls, saved };
}
test("native requests omit browser cookies and authenticate with a secure session token", async () => {
  const { client, calls, saved } = setup();
  await client.saveToken("test-session-token");
  await client.request("/memberships/my");
  assert.equal(saved.get("fitswap.session"), "test-session-token");
  assert.equal(calls[0].options.credentials, "omit");
  assert.equal(
    calls[0].options.headers.Authorization,
    "Bearer test-session-token",
  );
  assert.doesNotMatch(calls[0].url, /test-session-token/);
  await client.saveToken(null);
  assert.equal(saved.has("fitswap.session"), false);
});
test("browser requests keep cookie authentication without persisting tokens", async () => {
  const { client, calls, saved } = setup(200, {}, "web");
  await client.saveToken(null);
  await client.request("/auth/me");
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(saved.size, 0);
});
test("multipart uploads let the runtime choose the boundary and preserve idempotency keys", async () => {
  const { client, calls } = setup();
  const form = new FormData();
  form.append("body", "A support reply");
  await client.request("/support/tickets/test/messages", {
    method: "POST",
    body: form,
    key: "stable-intent",
  });
  assert.equal(calls[0].options.body, form);
  assert.equal(calls[0].options.headers["Content-Type"], undefined);
  assert.equal(calls[0].options.headers["Idempotency-Key"], "stable-intent");
});
test("expired protected requests invalidate the session while credential failures remain local", async () => {
  const { client } = setup(401, { message: "Expired" });
  let expired = 0;
  client.onSessionExpired(() => expired++);
  await assert.rejects(client.request("/auth/me"), /Expired/);
  assert.equal(expired, 1);
  await assert.rejects(
    client.request("/auth/mobile/login", { method: "POST" }),
    /Expired/,
  );
  assert.equal(expired, 1);
});
test("preview reads are isolated and every mutation is rejected before network access", async () => {
  const { client, calls } = setup();
  client.setPreviewRole("ADMIN");
  await client.request("/admin/users");
  for (const method of ["POST", "PATCH", "DELETE"])
    await assert.rejects(
      client.request("/admin/users/test/role", {
        method,
        body: { role: "ADMIN" },
      }),
      /read-only/,
    );
  assert.equal(calls.length, 0);
});
test("server validation messages retain the status and error code", async () => {
  const { client } = setup(403, {
    message: "Reauthentication required",
    code: "REAUTHENTICATION_REQUIRED",
  });
  await assert.rejects(
    client.request("/admin/users"),
    (error) =>
      error.status === 403 &&
      error.code === "REAUTHENTICATION_REQUIRED" &&
      error.response.data.message === "Reauthentication required",
  );
});

test("iPhone login requests reach the Expo computer and keep native token authentication", async () => {
  const { client, calls } = setup(200, { success: true }, "ios", {
    hostUri: "192.168.1.77:8081",
  });
  await client.request("/auth/mobile/login", {
    method: "POST",
    body: { email: "member@example.test", password: "test-only-password" },
  });
  assert.equal(calls[0].url, "http://192.168.1.77:8000/api/auth/mobile/login");
  assert.equal(calls[0].options.credentials, "omit");
});

test("browser preview login uses the page hostname for same-site cookies", async () => {
  const { client, calls } = setup(200, { success: true }, "web", {
    browserOrigin: "http://127.0.0.1:8082",
  });
  await client.request("/auth/login", { method: "POST", body: {} });
  assert.equal(calls[0].url, "http://127.0.0.1:8000/api/auth/login");
  assert.equal(calls[0].options.credentials, "include");
});
