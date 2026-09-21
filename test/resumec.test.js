const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildArguments,
  expectedChecksum,
  normalizeVersion,
  parseExtraArgs,
  parseResult,
  releaseUrl,
  resolveVersion,
  validateArguments,
} = require("../src/resumec");

test("normalizes pinned versions", () => {
  assert.equal(normalizeVersion("v0.1.0"), "0.1.0");
  assert.equal(normalizeVersion("1.2.3-beta.1"), "1.2.3-beta.1");
  assert.equal(normalizeVersion("latest"), "latest");
  assert.throws(() => normalizeVersion("main"), /Invalid resumec version/);
});

test("resolves latest through the GitHub releases API", async () => {
  const fakeFetch = async (url, options) => {
    assert.match(url, /hebertcisco\/resumec\/releases\/latest$/);
    assert.equal(options.headers.Authorization, "Bearer token");
    return { ok: true, json: async () => ({ tag_name: "v0.1.0" }) };
  };
  assert.equal(await resolveVersion("latest", "token", fakeFetch), "0.1.0");
});

test("creates immutable release asset URLs", () => {
  assert.equal(
    releaseUrl("0.1.0", "resumec-linux-x86_64.tar.gz"),
    "https://github.com/hebertcisco/resumec/releases/download/v0.1.0/resumec-linux-x86_64.tar.gz",
  );
});

test("reads the checksum for an exact asset name", () => {
  const hash = "a".repeat(64);
  assert.equal(expectedChecksum(`${hash}  resumec-linux-x86_64.tar.gz\n`, "resumec-linux-x86_64.tar.gz"), hash);
});

test("parses extra arguments without shell evaluation", () => {
  assert.deepEqual(parseExtraArgs('["--quiet"]'), ["--quiet"]);
  assert.throws(() => parseExtraArgs("--quiet"), /valid JSON/);
  assert.throws(() => parseExtraArgs('[1]'), /only strings/);
});

test("builds arguments for resumec build", () => {
  assert.deepEqual(
    buildArguments({
      input: "/repo/resume.yaml",
      format: "both",
      theme: "modern",
      outputDir: "/repo/dist",
      outputName: "resume-en",
      overwrite: true,
      jsonOutput: true,
      extraArgs: ["--quiet"],
    }),
    [
      "build",
      "/repo/resume.yaml",
      "--format",
      "both",
      "--theme",
      "modern",
      "--output-dir",
      "/repo/dist",
      "--output-name",
      "resume-en",
      "--overwrite",
      "--non-interactive",
      "--json-output",
      "--quiet",
    ],
  );
});

test("builds arguments for resumec validate", () => {
  assert.deepEqual(
    validateArguments({ input: "resume.json", jsonOutput: true, extraArgs: [] }),
    ["validate", "resume.json", "--json-output"],
  );
});

test("parses resumec JSON output", () => {
  assert.deepEqual(parseResult('{"status":"success"}\n'), { status: "success" });
  assert.throws(() => parseResult("not-json"), /valid JSON/);
});

