# resumec Action

A reusable, dependency-free GitHub Action for validating resumes and generating PDF and DOCX files with [resumec](https://hebertcisco.github.io/resumec/). The Action downloads the official binary, verifies its SHA-256 checksum, and uses the runner tool cache. Consumer repositories do not need to install Rust or npm packages.

## Quick start

Create `.github/workflows/resume.yml` in the repository that contains your resume:

```yaml
name: Build resume

on:
  push:
    branches: [main]
    paths:
      - resume.yaml
  pull_request:
    paths:
      - resume.yaml

permissions:
  contents: read

jobs:
  resume:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Build resume
        id: resumec
        uses: hebertcisco/resumec-action@v1
        with:
          input: resume.yaml
          format: both
          theme: modern
          output-dir: dist

      - name: Upload generated files
        uses: actions/upload-artifact@v7
        with:
          name: resume
          path: ${{ steps.resumec.outputs.output-dir }}
          if-no-files-found: error
```

For stronger supply-chain security, replace `@v1` with the full commit SHA of a published version.

## Validate pull requests and build on main

```yaml
- name: Validate resume
  if: github.event_name == 'pull_request'
  uses: hebertcisco/resumec-action@v1
  with:
    command: validate
    input: resume.yaml

- name: Build resume
  if: github.event_name == 'push'
  uses: hebertcisco/resumec-action@v1
  with:
    command: build
    input: resume.yaml
    output-dir: dist
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `command` | `build` | `build`, `validate`, or `install` |
| `input` | `resume.yaml` | JSON, TOML, or YAML resume file |
| `version` | `v0.1.0` | `resumec` version or `latest` |
| `format` | `both` | `pdf`, `docx`, or `both` |
| `theme` | `modern` | Theme used by the build command |
| `output-dir` | `dist` | Output directory |
| `output-name` | — | Optional base name for generated files |
| `overwrite` | `true` | Replace existing output files |
| `json-output` | `true` | Enable machine-readable CLI output |
| `extra-args` | `[]` | Additional arguments as a JSON string array |
| `github-token` | — | Optional token, used only with `version: latest` |

Example with additional arguments:

```yaml
with:
  extra-args: '["--quiet"]'
```

Arguments are passed directly to the process without shell evaluation.

## Outputs

| Output | Description |
| --- | --- |
| `version` | Installed `resumec` version |
| `binary-path` | Absolute path to the executable |
| `output-dir` | Absolute path to the output directory |
| `files` | JSON array containing generated file paths |
| `result` | Complete JSON response returned by `resumec` |

The `install` command adds the executable to the `PATH` for subsequent steps:

```yaml
- uses: hebertcisco/resumec-action@v1
  with:
    command: install

- run: resumec --version
```

## Supported platforms

The Action follows the binaries published by `resumec` and currently supports Linux, macOS, and Windows `x64` runners. macOS ARM64 runners are not supported yet because the CLI does not publish that artifact.

## Development

Node.js 24 is required:

```bash
npm ci
npm test
npm run check
```

The Action runs directly from `src/index.js` and has no runtime package dependencies. Generated `dist/` files are intentionally ignored.

## Action versioning

Publish semantic versions such as `v1.0.0`, and keep the `v1` major reference pointing to the latest compatible release. The `version` input independently controls which `resumec` CLI version the Action downloads.

## License

[MIT](LICENSE)
