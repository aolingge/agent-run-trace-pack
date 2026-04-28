# Launch Kit

Agent Run Trace Pack is public on npm. This launch kit keeps maintainer review local-first and avoids unsupported security or adoption claims.

## Maintainer Checklist

- Confirm Node.js `>=20`.
- Run `npm install` and `npm run build`.
- Try the [safe examples](examples.md), starting with `node dist/cli.js run -- npm test`.
- Review the [safety model](../README.md#safety-model), [report preview](../assets/report-preview.svg), and [release readiness checklist](release-readiness.md).
- Run the required local checks from `docs/release-readiness.md`: `npm run check`, `npm run smoke`, and `node scripts/release-dry-run.mjs`.
- Confirm generated trace output stays under ignored local paths such as `.tmp/` or `.agent-traces/`.
- Do not publish a follow-up version, create a git tag, create a GitHub release, post announcements, or collect release credentials without an explicit release decision.

## Demo Command

```bash
npm install
npm run build
node dist/cli.js run --out .tmp/demo -- node -e "console.log('synthetic demo: local test passed'); console.error('synthetic demo: review warning')"
```

Open the generated `report.md` or `report.html` under `.tmp/demo/<trace-directory>/` and confirm the command, redacted output, git state, and risk signals are understandable.

## FAQ And Troubleshooting

`node dist/cli.js` is missing: run `npm run build`.

`artrace` or `agent-run-trace-pack` is not found: use `npx agent-run-trace-pack`, run `npm install` from source, or put the local package bin on your `PATH`.

`npm run check` fails on unrelated local notes: the lint script scans Markdown and other text files in the repository, including untracked files. Keep temporary notes outside the repo or save them with LF line endings, no trailing whitespace, and a final newline.

Browser preview needs a local server: serve the repository root and open `/docs/index.html`; the docs are static and make no hosted calls.

## P0/P1/P2 Backlog

P0: none open from launch-doc implementation.

P1: none open from launch-doc implementation.

P2: generated helper notes with CRLF endings can block `npm run check` because the lint script scans untracked Markdown files.

P2: Markdown docs render as plain text in a bare static server. A later docs site can add styled Markdown rendering after public hosting is chosen.

P2: public links, badges, npm package claims, GitHub releases, and external announcements must point only to live public surfaces.
