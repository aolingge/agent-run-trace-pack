# Agent Run Trace Pack Instructions

- Keep the CLI local-first. Do not add telemetry, hosted calls, or model-provider calls.
- Do not write secrets, cookies, private logs, browser profiles, or private URLs into fixtures or docs.
- Every new detector should include a fixture or unit test.
- Run `npm run check` before committing behavior changes.
