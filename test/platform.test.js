const assert = require("node:assert/strict");
const test = require("node:test");

const { getAsset } = require("../src/platform");

test("maps supported runners to release assets", () => {
  assert.equal(getAsset("linux", "x64").asset, "resumec-linux-x86_64.tar.gz");
  assert.equal(getAsset("darwin", "x64").asset, "resumec-macos-x86_64.tar.gz");
  assert.equal(getAsset("win32", "x64").asset, "resumec-windows-x86_64.zip");
});

test("rejects runners without a published resumec binary", () => {
  assert.throws(() => getAsset("linux", "arm64"), /Unsupported runner/);
});

