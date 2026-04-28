# Agent Run Trace

## Trace Summary

- Trace: `2026-04-28T00-00-00-000Z`
- Exit or signal: `signal SIGTERM`
- Duration: `1234ms`
- Working directory: `/synthetic/project`
- Started: `2026-04-28T00:00:00.000Z`
- Ended: `2026-04-28T00:00:01.234Z`

## Command

```text
node -e console.log("<ok>")
```

## Git Before

- Available: `true`
- Root: `/synthetic/project`
- Branch: `main`
- Head: `abc123`
- Status: `clean`

## Git After

- Available: `true`
- Root: `/synthetic/project`
- Branch: `feature/report-polish`
- Head: `def456`
- Status: `M src/report/render.ts`

## Findings by Severity

### P0

#### HTML <escape> check

Command included <script>alert('x')</script> text.

Evidence:

```text
rm -rf /tmp/synthetic && echo "<secret>"
```

Suggested action: Review the trace and confirm a rollback plan before replaying.

### P2

#### Permission failure signal

The run output included EPERM for a synthetic local path.

Suggested action: Record the command, working directory, and permission boundary before retrying.

## Git Diff Stat

```text
src/report/render.ts | 10 +++++-----
1 file changed, 5 insertions(+), 5 deletions(-)
<diff-check>
```

## Output Files

- stdout: `stdout.log`
- stderr: `stderr.log`
- diff: `diff.patch`
- manifest: `manifest.json`
- markdown: `report.md`
- html: `report.html`
