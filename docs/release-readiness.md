# Release Readiness

This checklist keeps Agent Run Trace Pack releases repeatable. The package is public on npm and local usage requires Node.js `>=20`.

## Required Checks

Run these exact local checks before release review:

```bash
npm run check
npm run smoke
node scripts/release-dry-run.mjs
```

## Package Contract

The package metadata supports Node `>=20` and exposes the `agent-run-trace-pack` and `artrace` binaries.

The npm `files` allowlist is:

- `dist`
- `docs`
- `assets`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`

`node scripts/release-dry-run.mjs` validates the package preview with `npm pack --dry-run --json` and verifies these required package entries:

- `package.json`
- `README.md`
- `LICENSE`
- `dist/cli.js`
- `docs/index.html`
- `docs/examples.md`
- `docs/launch-kit.md`
- `docs/release-readiness.md`
- `assets/social-preview.png`

`npm run smoke` writes output only under the ignored `.tmp/smoke/` path and then runs `node scripts/validate-trace.mjs .tmp/smoke` to verify the trace artifacts:

- `manifest.json`
- `stdout.log`
- `stderr.log`
- `diff.patch`
- `report.md`
- `report.html`

The smoke and release dry-run checks are local-only. They do not require network access, credentials, publish tokens, telemetry, hosted calls, or model-provider calls.

## Public Link Boundary

The project is in public npm mode: the public GitHub repository, documentation URL, and npm package page are live. Keep install claims tied to the live package page and rerun the release checks before publishing any follow-up version.

- Public repository: https://github.com/aolingge/agent-run-trace-pack
- Documentation: https://aolingge.github.io/agent-run-trace-pack/
- npm package: https://www.npmjs.com/package/agent-run-trace-pack

## Manual Release Boundary

These steps stay manual until explicitly confirmed:

- version bump
- git tag
- GitHub release
- npm publish or dist-tag change
- external platform posts
- release credential collection or use
