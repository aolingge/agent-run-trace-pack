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

The project is in pre-release npm mode: the public GitHub repository and documentation URL exist, and the npm package is not published yet. Public repository, issue tracker, CI badge, and homepage links are allowed; keep npm install claims as pre-publication wording until the package is live.

- Public repository: https://github.com/aolingge/agent-run-trace-pack
- Documentation: https://aolingge.github.io/agent-run-trace-pack/
- npm package: pending

## Manual Release Boundary

These steps stay manual until explicitly confirmed:

- version bump
- git tag
- GitHub release
- npm publish
- external platform posts
- release credential collection or use
