# Safe Examples

These examples use synthetic output only. Do not paste secrets, cookies, passwords, connection strings, private logs, browser profiles, private URLs, customer code, or real credentials into examples, fixtures, reports, or docs.

Public npm path:

```bash
npx agent-run-trace-pack run -- node -e "console.log('agent step')"
```

Build the CLI when contributing from source:

```bash
npm install
npm run build
```

## npm Test Wrapper

Source command:

```bash
node dist/cli.js run --out .tmp/examples/npm-test -- npm test
```

Equivalent command shapes once the local package bin is on your `PATH`:

```bash
artrace run --out .tmp/examples/npm-test -- npm test
agent-run-trace-pack run --out .tmp/examples/npm-test -- npm test
```

## Synthetic Agent-Style Runs

These commands do not invoke real coding agents. They use `node -e` to print safe local output that resembles common agent workflows.

Codex-style:

```bash
node dist/cli.js run --out .tmp/examples/codex -- node -e "console.log('codex-style: inspect README.md'); console.log('codex-style: npm test passed')"
```

Claude Code-style:

```bash
node dist/cli.js run --out .tmp/examples/claude-code -- node -e "console.log('claude-code-style: update docs/examples.md'); console.error('claude-code-style: synthetic warning')"
```

Gemini CLI-style:

```bash
node dist/cli.js run --out .tmp/examples/gemini-cli -- node -e "console.log('gemini-cli-style: summarize synthetic fixture manifest')"
```

OpenCode-style:

```bash
node dist/cli.js run --out .tmp/examples/opencode -- node -e "console.log('opencode-style: run local unit tests'); console.log('opencode-style: no external calls')"
```

Goose-style:

```bash
node dist/cli.js run --out .tmp/examples/goose -- node -e "console.log('goose-style: gather git status'); console.log('goose-style: write local report')"
```

## Review A Trace

Each run writes a timestamped trace directory below the selected `--out` path. Review the generated `manifest.json`, `report.md`, and `report.html` before sharing anything outside a private workspace.

```bash
node dist/cli.js summarize .tmp/examples/npm-test/<trace-directory>
```
