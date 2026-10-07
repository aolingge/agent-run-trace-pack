# Command Guide

Use this guide to choose the smallest command that answers the current maintainer question.

## `run`

Use `run` when you want to execute a local command and save a trace pack for review.

```bash
agent-run-trace-pack run -- npm test
agent-run-trace-pack run --out .tmp/traces -- node scripts/check-fixture.mjs
```

What it does:

- Runs the command after `--`.
- Saves redacted stdout and stderr.
- Captures git state, diff summary, and risk signals.
- Writes `manifest.json`, `report.md`, and `report.html`.

Use it for local test runs, release preflights, CI reproduction, and synthetic agent-style demos. Do not use it as approval to publish, push, tag, or run commands that need credentials.

## `summarize`

Use `summarize` when a trace directory already exists and you want to regenerate or inspect its review report.

```bash
agent-run-trace-pack summarize .agent-traces/2026-04-28T10-00-00-000Z
```

What it does:

- Reads an existing trace directory.
- Prints the trace summary.
- Keeps review focused on the saved local evidence.

Use it during handoff review, release notes drafting, or bug triage when the command has already run.

## `doctor`

Use `doctor` before asking someone else to reproduce a trace workflow.

```bash
agent-run-trace-pack doctor
```

What it checks:

- Node.js runtime compatibility.
- Git availability and repository context.
- Local write access needed for trace output.

Use it for contributor onboarding, CI environment checks, and support requests where the trace command cannot start.

## `init`

Use `init` to add a minimal local trace workspace convention to a repository.

```bash
agent-run-trace-pack init
```

What it does:

- Creates local trace-output defaults when needed.
- Keeps generated traces under ignored local paths.
- Avoids hosted services, telemetry, or model-provider configuration.

Use it once per repository before collecting repeatable local traces.

## Contributor Workflow

Recommended order:

1. Run `agent-run-trace-pack doctor`.
2. Run `agent-run-trace-pack init` if the repository has no trace-output convention yet.
3. Run `agent-run-trace-pack run -- <safe local command>`.
4. Review `manifest.json`, `report.md`, and `report.html`.
5. Use `agent-run-trace-pack summarize <trace-dir>` during handoff or release-note drafting.
