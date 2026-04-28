# Release Readiness

This checklist prepares Agent Run Trace Pack for public release without performing npm publication. The repository is pre-release and source-mode only until a public npm package exists; local usage requires Node.js `>=20`.

## Required Checks

Run these exact local checks before release review:

```bash
npm run check
npm run smoke
node scripts/release-dry-run.mjs
```

## Package Contract

The package metadata supports Node `>=20`, exposes the `agent-run-trace-pack` and `artrace` binaries after build, and keeps source-mode usage as the active pre-release path.

The npm `files` allowlist is:

- `dist`
- `docs`
- `assets`
- `README.md`
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

The project starts in pre-release source mode. Add public GitHub, issue tracker, CI badge, homepage, and npm links only after the corresponding public surfaces exist.

## Manual Release Boundary

These steps stay manual until explicitly confirmed:

- version bump
- git tag
- GitHub release
- npm publish
- external platform posts
- release credential collection or use
