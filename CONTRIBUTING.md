# Contributing

Contributions are welcome through focused issues and pull requests.

## Local setup

Install Node.js 24, then run:

```bash
npm ci
npm test
npm run build
```

The generated `dist/index.cjs` file is part of the Action distribution. Include an updated bundle whenever source files or runtime dependencies change.

## Pull requests

- Keep changes focused and document user-facing behavior.
- Add or update tests for behavior changes.
- Run `npm test` and `npm run build` before submitting.
- Do not include credentials, personal resume data, or generated resume files.

