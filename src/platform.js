const SUPPORTED_ASSETS = Object.freeze({
  "linux-x64": {
    asset: "resumec-linux-x86_64.tar.gz",
    executable: "resumec",
    archive: "tar",
  },
  "darwin-x64": {
    asset: "resumec-macos-x86_64.tar.gz",
    executable: "resumec",
    archive: "tar",
  },
  "win32-x64": {
    asset: "resumec-windows-x86_64.zip",
    executable: "resumec.exe",
    archive: "zip",
  },
});

export function getAsset(platform = process.platform, arch = process.arch) {
  const key = `${platform}-${arch}`;
  const asset = SUPPORTED_ASSETS[key];

  if (!asset) {
    throw new Error(
      `Unsupported runner ${platform}/${arch}. resumec currently publishes binaries for Linux, macOS, and Windows on x64.`,
    );
  }

  return asset;
}

export { SUPPORTED_ASSETS };
