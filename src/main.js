import fs from "node:fs";
import path from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as toolCache from "@actions/tool-cache";

import { getAsset } from "./platform.js";
import {
  buildArguments,
  findExecutable,
  parseExtraArgs,
  parseResult,
  releaseUrl,
  resolveVersion,
  validateArguments,
  verifyChecksum,
} from "./resumec.js";

export function getInputs() {
  return {
    command: core.getInput("command", { required: true }).toLowerCase(),
    input: core.getInput("input"),
    version: core.getInput("version", { required: true }),
    format: core.getInput("format"),
    theme: core.getInput("theme"),
    outputDir: core.getInput("output-dir"),
    outputName: core.getInput("output-name"),
    overwrite: core.getBooleanInput("overwrite"),
    jsonOutput: core.getBooleanInput("json-output"),
    extraArgs: parseExtraArgs(core.getInput("extra-args")),
    token: core.getInput("github-token"),
  };
}

export async function install(version, assetInfo) {
  let directory = toolCache.find("resumec", version, process.arch);

  if (!directory) {
    const assetUrl = releaseUrl(version, assetInfo.asset);
    const checksumUrl = releaseUrl(version, "SHA256SUMS");
    core.info(`Downloading resumec v${version} from ${assetUrl}`);

    const [archive, checksums] = await Promise.all([
      toolCache.downloadTool(assetUrl),
      toolCache.downloadTool(checksumUrl),
    ]);
    verifyChecksum(archive, checksums, assetInfo.asset);
    core.info("SHA-256 checksum verified");

    const extracted =
      assetInfo.archive === "zip"
        ? await toolCache.extractZip(archive)
        : await toolCache.extractTar(archive);
    directory = await toolCache.cacheDir(
      extracted,
      "resumec",
      version,
      process.arch,
    );
  } else {
    core.info(`Using cached resumec v${version}`);
  }

  const binary = findExecutable(directory, assetInfo.executable);
  if (process.platform !== "win32") fs.chmodSync(binary, 0o755);
  core.addPath(path.dirname(binary));
  return binary;
}

export async function run() {
  const inputs = getInputs();
  if (!new Set(["build", "validate", "install"]).has(inputs.command)) {
    throw new Error("command must be one of: build, validate, install");
  }

  const asset = getAsset();
  const version = await resolveVersion(inputs.version, inputs.token);
  const binary = await install(version, asset);
  core.setOutput("version", version);
  core.setOutput("binary-path", binary);

  if (inputs.command === "install") {
    core.info(`resumec v${version} installed successfully`);
    return;
  }

  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  inputs.input = path.resolve(workspace, inputs.input);
  if (!fs.existsSync(inputs.input)) {
    throw new Error(`Resume input file not found: ${inputs.input}`);
  }
  if (inputs.outputDir) inputs.outputDir = path.resolve(workspace, inputs.outputDir);

  const args =
    inputs.command === "build"
      ? buildArguments(inputs)
      : validateArguments(inputs);
  let stdout = "";
  const exitCode = await exec.exec(binary, args, {
    ignoreReturnCode: true,
    listeners: {
      stdout: (data) => {
        stdout += data.toString();
      },
    },
  });

  if (exitCode !== 0) {
    throw new Error(`resumec ${inputs.command} failed with exit code ${exitCode}`);
  }

  if (inputs.command === "build" && inputs.outputDir) {
    core.setOutput("output-dir", inputs.outputDir);
  }

  if (inputs.jsonOutput) {
    const result = parseResult(stdout);
    core.setOutput("result", JSON.stringify(result));
    const files = result?.data?.outputs?.map((output) => output.path) || [];
    core.setOutput("files", JSON.stringify(files));
  }
}
