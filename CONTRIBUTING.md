# Contributing

Contributions are welcome through focused issues and pull requests.

## Local setup

Install Node.js 24, then run:

```bash
npm ci
npm test
npm run check
```

The Action runs directly from `src/index.js` without runtime package dependencies. Do not commit generated `dist/` files.

## Pull requests

- Keep changes focused and document user-facing behavior.
- Add or update tests for behavior changes.
- Run `npm run check` before submitting.
- Do not include credentials, personal resume data, or generated resume files.
