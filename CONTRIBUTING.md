# Contributing

Thanks for helping make coding-agent runs easier to review.

## Local Setup

```bash
npm install
npm run check
```

## Pull Requests

- Keep changes focused.
- Add or update a test when changing redaction, risk detection, CLI behavior, or report rendering.
- Use synthetic fixtures only.
- Never include real secrets, private logs, cookies, browser profiles, private URLs, or customer code.
- Explain user-facing report changes in the PR summary.

## Good First Issues

- Add a narrow risk detector with a fixture.
- Improve report wording.
- Add a safe example for one coding agent command.
- Improve documentation clarity.
