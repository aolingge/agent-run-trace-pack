# Review a CI failure trace

This example wraps a deliberately failing synthetic command and keeps a small report available after failure. It is a recipe for GitHub.com, not an installed workflow or a hosted trace service.

## Reproduce locally

From a source checkout:

```bash
npm ci
npm run build
node dist/cli.js run --out .tmp/ci-example -- node fixtures/ci-failure.mjs
```

The final command exits with **7**, preserving the child result. This is expected. Inspect the newest `.tmp/ci-example/<trace-id>/` directory: `manifest.json` records `exitCode: 7`, `stderr.log` contains the synthetic permission failure, and `stdout.log` replaces the synthetic token assignment with `[REDACTED_SECRET]`. The fixture never reads a credential or calls an agent.

Representative saved output, with timestamps and machine paths omitted:

```text
synthetic CI: starting verification
token=[REDACTED_SECRET]

synthetic CI: permission denied while opening a fixture
```

`report.md` explains the permission and secret-like-output findings; `report.html` is the same review surface in a browser. The original synthetic value remains in the public fixture so its purpose is auditable. Redaction is not a guarantee that arbitrary command arguments, paths or diffs are suitable to share.

## GitHub.com workflow recipe

Save the following as a workflow only after reviewing it for your repository. It uses a manual trigger, a public synthetic fixture, read-only repository permission and immutable Action revisions. There is no automatic PR comment, release, package publication or privileged fork trigger.

```yaml
name: Synthetic trace example
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  trace:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Capture a synthetic failure
        run: node dist/cli.js run --out trace-artifacts -- node fixtures/ci-failure.mjs
      - name: Keep review reports after failure
        if: always()
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: synthetic-trace-${{ github.run_id }}-${{ github.run_attempt }}
          path: |
            trace-artifacts/*/manifest.json
            trace-artifacts/*/report.md
            trace-artifacts/*/report.html
          if-no-files-found: warn
          retention-days: 7
          include-hidden-files: false
```

The job intentionally remains failed because the capture step returns 7. `always()` lets the upload run after that failure; it does not turn the failure into success. If installation/build fails before capture, there may be no trace, and upload reports a warning.

The wrapper preserves a completed child's exit code. If the process cannot start or capture fails, it returns 1 and records an additive `executionError` with a fixed description in the manifest and reports. For example, `ENOENT` means the executable or working directory was not found. `ENOBUFS` means the existing 1 MiB capture limit was exceeded: the child may have been terminated and saved output may be incomplete. A real termination signal remains in the manifest's `signal` field; it is not a substitute for the capture error. Correct the cause and rerun before relying on the transcript. Native error messages and spawn argument objects are not persisted.

The upload allowlist excludes raw logs and `diff.patch`; reports still contain command, repository and finding metadata. Use this automatic upload only for synthetic or already reviewed data. Inspect real traces locally before sharing, and do not broaden the path to the repository root or enable hidden files merely to resolve a missing-file warning. Repository retention/access policy still applies.

The official [upload-artifact documentation](https://github.com/actions/upload-artifact/tree/v7.0.2#usage) describes missing-file handling, retention and hidden-file inputs. This version is for GitHub.com; see its compatibility notes before adapting it to GitHub Enterprise Server. The application runtime remains Node 20 here; each Action has its own runner runtime.
