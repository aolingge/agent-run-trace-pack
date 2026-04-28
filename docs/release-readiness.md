# Release Readiness

This checklist prepares Agent Run Trace Pack for public release without performing npm publication.

## Required Checks

```bash
npm run check
npm run smoke
node scripts/release-dry-run.mjs
```

## Package Contract

The package preview must include:

- `package.json`
- `README.md`
- `LICENSE`
- `dist/cli.js`
- `docs/index.html`
- `docs/release-readiness.md`
- `assets/social-preview.png`

## Public Link Boundary

The project starts in pre-release source mode. Add public GitHub, issue tracker, CI badge, homepage, and npm links only after the corresponding public surfaces exist.

## Manual Release Boundary

These steps stay manual until explicitly confirmed:

- version bump,
- git tag,
- GitHub release,
- npm publish,
- external platform posts.
