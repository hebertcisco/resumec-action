import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OWNER = "hebertcisco";
const REPOSITORY = "resumec";

export function normalizeVersion(value) {
  const requested = value.trim();
  if (requested === "latest") return requested;

  const version = requested.replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid resumec version: ${value}`);
  }
  return version;
}

export async function resolveVersion(requested, token, fetchImpl = fetch) {
  const normalized = normalizeVersion(requested);
  if (normalized !== "latest") return normalized;

  const apiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "resumec-action",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchImpl(
    `${apiUrl}/repos/${OWNER}/${REPOSITORY}/releases/latest`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(
      `Unable to resolve the latest resumec release: HTTP ${response.status}`,
    );
  }

  const release = await response.json();
  return normalizeVersion(release.tag_name);
}

export function releaseUrl(version, asset) {
  return `https://github.com/${OWNER}/${REPOSITORY}/releases/download/v${version}/${asset}`;
}

export function expectedChecksum(checksums, asset) {
  for (const line of checksums.split(/\r?\n/)) {
    const match = line.trim().match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);
    if (match && match[2] === asset) return match[1].toLowerCase();
  }
  throw new Error(`SHA-256 checksum not found for ${asset}`);
}

function sha256(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

export function verifyChecksum(file, checksumsFile, asset) {
  const expected = expectedChecksum(fs.readFileSync(checksumsFile, "utf8"), asset);
  const actual = sha256(file);
  if (actual !== expected) {
    throw new Error(
      `Checksum mismatch for ${asset}: expected ${expected}, received ${actual}`,
    );
  }
}

export function findExecutable(directory, executable) {
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const candidate = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(candidate);
      if (entry.isFile() && entry.name === executable) return candidate;
    }
  }
  throw new Error(`Executable ${executable} was not found after extraction`);
}

export function parseExtraArgs(value) {
  let args;
  try {
    args = JSON.parse(value || "[]");
  } catch {
    throw new Error("extra-args must be a valid JSON string array");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    throw new Error("extra-args must be a JSON array containing only strings");
  }
  return args;
}

export function buildArguments(inputs) {
  if (!inputs.input) throw new Error("input is required for build");
  const args = ["build", inputs.input];
  if (inputs.format) args.push("--format", inputs.format);
  if (inputs.theme) args.push("--theme", inputs.theme);
  if (inputs.outputDir) args.push("--output-dir", inputs.outputDir);
  if (inputs.outputName) args.push("--output-name", inputs.outputName);
  if (inputs.overwrite) args.push("--overwrite");
  args.push("--non-interactive");
  if (inputs.jsonOutput) args.push("--json-output");
  return args.concat(inputs.extraArgs);
}

export function validateArguments(inputs) {
  if (!inputs.input) throw new Error("input is required for validate");
  const args = ["validate", inputs.input];
  if (inputs.jsonOutput) args.push("--json-output");
  return args.concat(inputs.extraArgs);
}

export function parseResult(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("resumec did not return valid JSON output");
  }
}

export { OWNER, REPOSITORY };
