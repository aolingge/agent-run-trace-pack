import type { TraceManifest } from "../types.js";

export function renderMarkdownReport(manifest: TraceManifest): string {
  const lines = [
    "# Agent Run Trace",
    "",
    `- Trace: \`${manifest.traceId}\``,
    `- Command: \`${manifest.command.join(" ")}\``,
    `- Exit code: \`${manifest.exitCode ?? "signal"}\``,
    `- Duration: \`${manifest.durationMs}ms\``,
    `- Working directory: \`${manifest.cwd}\``,
    `- Git before: \`${manifest.gitBefore.head ?? "unknown"}\``,
    `- Git after: \`${manifest.gitAfter.head ?? "unknown"}\``,
    "",
    "## Findings",
    ""
  ];

  if (manifest.findings.length === 0) {
    lines.push("No risk findings across checked trace surfaces.", "");
  } else {
    for (const finding of manifest.findings) {
      lines.push(`### ${finding.severity} ${finding.title}`);
      lines.push("");
      lines.push(finding.detail);
      if (finding.evidence) lines.push("", `Evidence: \`${finding.evidence}\``);
      lines.push("", `Suggested action: ${finding.suggestion}`, "");
    }
  }

  lines.push("## Git Diff Stat", "");
  lines.push("```text", manifest.gitAfter.diffStat || "No tracked diff after run.", "```", "");
  lines.push("## Files", "");
  lines.push(`- stdout: \`${manifest.files.stdout}\``);
  lines.push(`- stderr: \`${manifest.files.stderr}\``);
  lines.push(`- diff: \`${manifest.files.diff}\``);
  lines.push(`- manifest: \`${manifest.files.json}\``);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function renderHtmlReport(manifest: TraceManifest): string {
  const findings = manifest.findings.length
    ? manifest.findings
        .map(
          (finding) => `<article class="finding ${finding.severity.toLowerCase()}"><b>${escapeHtml(finding.severity)}</b><h3>${escapeHtml(finding.title)}</h3><p>${escapeHtml(finding.detail)}</p><p>${escapeHtml(finding.suggestion)}</p></article>`
        )
        .join("\n")
    : `<p class="quiet">No risk findings across checked trace surfaces.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agent Run Trace ${escapeHtml(manifest.traceId)}</title>
  <style>
    :root { --ink:#181714; --paper:#f7f8fb; --panel:#fff; --line:#d8dee8; --blue:#315f9f; --red:#b42318; --amber:#b46917; --green:#1f7a5b; --muted:#526071; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, Cambria, "Times New Roman", serif; color:var(--ink); background:var(--paper); }
    main { width:min(1040px, calc(100% - 32px)); margin:0 auto; padding:48px 0; }
    h1 { font-size: clamp(40px, 8vw, 72px); line-height:.95; margin:0 0 18px; }
    code, pre, .mono { font-family: ui-monospace, Consolas, monospace; }
    .panel { background:var(--panel); border:3px solid var(--ink); padding:24px; box-shadow:14px 14px 0 #c8d4e8; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:28px 0; }
    .metric, .finding { background:var(--panel); border:1px solid var(--line); padding:18px; }
    .metric b { display:block; font-size:13px; color:var(--muted); text-transform:uppercase; }
    .metric span { font-size:24px; color:var(--blue); }
    .finding b { color:var(--amber); }
    .finding.p0 b { color:var(--red); }
    .quiet { color:var(--muted); }
    pre { overflow:auto; background:#181714; color:#f7f8fb; padding:18px; }
    @media (max-width: 760px) { .grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <div class="mono">agent-run-trace-pack</div>
      <h1>Agent Run Trace</h1>
      <p class="quiet">${escapeHtml(manifest.command.join(" "))}</p>
    </section>
    <section class="grid">
      <div class="metric"><b>Exit</b><span>${escapeHtml(String(manifest.exitCode ?? "signal"))}</span></div>
      <div class="metric"><b>Duration</b><span>${manifest.durationMs}ms</span></div>
      <div class="metric"><b>Findings</b><span>${manifest.findings.length}</span></div>
    </section>
    <section>
      <h2>Findings</h2>
      ${findings}
    </section>
    <section>
      <h2>Git Diff Stat</h2>
      <pre>${escapeHtml(manifest.gitAfter.diffStat || "No tracked diff after run.")}</pre>
    </section>
  </main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
