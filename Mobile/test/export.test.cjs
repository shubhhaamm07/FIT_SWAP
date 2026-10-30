const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function nativeExporter(write) {
  const shared = [];
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/utils/export.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mocks = {
    "react-native": { Platform: { OS: "ios" } },
    "expo-file-system": {
      Paths: { cache: "file:///cache/" },
      File: class {
        constructor(directory, name) {
          this.uri = directory + name;
        }
        write(contents) {
          return write(contents);
        }
      },
    },
    "expo-sharing": {
      isAvailableAsync: async () => true,
      shareAsync: async (uri) => shared.push(uri),
    },
  };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (id) => mocks[id],
  });
  return { exportCsv: module.exports.exportCsv, shared };
}

test("native CSV sharing waits until the asynchronous file write finishes", async () => {
  let finishWrite;
  const written = new Promise((resolve) => {
    finishWrite = resolve;
  });
  const exporter = nativeExporter(() => written);
  const pending = exporter.exportCsv("sales.csv", [{ price: 6500 }]);
  await new Promise(setImmediate);
  assert.equal(exporter.shared.length, 0);
  finishWrite();
  await pending;
  assert.deepEqual(exporter.shared, ["file:///cache/sales.csv"]);
});

test("a failed CSV file write never opens the share sheet", async () => {
  const exporter = nativeExporter(async () => {
    throw new Error("Storage unavailable");
  });
  await assert.rejects(
    exporter.exportCsv("sales.csv", [{ price: 6500 }]),
    /Storage unavailable/,
  );
  assert.equal(exporter.shared.length, 0);
});
