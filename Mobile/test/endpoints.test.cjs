const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveServiceUrls,
  isLocalHost,
} = require("../src/utils/endpoints.cjs");
test("physical iPhone and Android discover the Mac's local server from Expo", () => {
  for (const platform of ["ios", "android"]) {
    assert.deepEqual(
      resolveServiceUrls({
        platform,
        development: true,
        expoHostUri: "192.168.1.77:8081",
      }),
      {
        apiUrl: "http://192.168.1.77:8000/api",
        webUrl: "http://192.168.1.77:5173",
      },
    );
  }
});
test("Expo URLs and local DNS names work without hard-coding a network address", () => {
  assert.equal(
    resolveServiceUrls({
      platform: "ios",
      development: true,
      expoHostUri: "exp://macbook.local:8081",
    }).apiUrl,
    "http://macbook.local:8000/api",
  );
  assert.equal(
    resolveServiceUrls({
      platform: "ios",
      development: true,
      expoHostUri: "[fd00::1]:8081",
    }).apiUrl,
    "http://[fd00::1]:8000/api",
  );
});
test("desktop preview keeps localhost and 127.0.0.1 consistent with its cookies", () => {
  for (const host of ["localhost", "127.0.0.1"]) {
    assert.equal(
      resolveServiceUrls({
        platform: "web",
        browserOrigin: `http://${host}:8082`,
      }).apiUrl,
      `http://${host}:8000/api`,
    );
  }
});
test("explicit deployed URLs override every development fallback", () => {
  assert.deepEqual(
    resolveServiceUrls({
      platform: "ios",
      development: true,
      expoHostUri: "192.168.1.77:8081",
      apiUrl: "https://api.fitswap.example/api/",
      webUrl: "https://fitswap.example/",
    }),
    {
      apiUrl: "https://api.fitswap.example/api",
      webUrl: "https://fitswap.example",
    },
  );
});
test("release native apps do not infer endpoints from development metadata", () => {
  assert.equal(
    resolveServiceUrls({
      platform: "ios",
      development: false,
      expoHostUri: "192.168.1.77:8081",
    }).apiUrl,
    "http://localhost:8000/api",
  );
});
test("simulators retain their correct loopback defaults", () => {
  assert.equal(
    resolveServiceUrls({ platform: "ios", development: true }).apiUrl,
    "http://localhost:8000/api",
  );
  assert.equal(
    resolveServiceUrls({
      platform: "android",
      development: true,
      expoHostUri: "localhost:8081",
    }).apiUrl,
    "http://10.0.2.2:8000/api",
  );
});
test("tunnels and public lookalike hosts are not mistaken for a local API", () => {
  for (const host of [
    "demo.exp.direct",
    "10.attacker.example",
    "192.168.attacker.example",
    "localhost.attacker.example",
    "172.32.1.1",
  ]) {
    assert.equal(isLocalHost(host), false);
  }
  assert.equal(
    resolveServiceUrls({
      platform: "ios",
      development: true,
      expoHostUri: "demo.exp.direct:8081",
    }).apiUrl,
    "http://localhost:8000/api",
  );
});
