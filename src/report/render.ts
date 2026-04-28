import type { GitSnapshot, RiskFinding, Severity, TraceManifest } from "../types.js";

const severityOrder: Severity[] = ["P0", "P1", "P2", "P3"];

export function renderMarkdownReport(manifest: TraceManifest): string {
  const lines = [
    "# Agent Run Trace",
    "",
    "## Trace Summary",
    "",
    `- Trace: \`${manifest.traceId}\``,
    `- Exit or signal: \`${formatExitOrSignal(manifest)}\``,
    `- Duration: \`${manifest.durationMs}ms\``,
    `- Working directory: \`${manifest.cwd}\``,
    `- Started: \`${manifest.startedAt}\``,
    `- Ended: \`${manifest.endedAt}\``,
    "",
    "## Command",
    "",
    codeFence(manifest.command.join(" ")),
    "",
    "## Git Before",
    "",
    ...renderMarkdownGitSnapshot(manifest.gitBefore),
    "",
    "## Git After",
    "",
    ...renderMarkdownGitSnapshot(manifest.gitAfter),
    ""
  ];

  lines.push("## Findings by Severity", "");
  if (manifest.findings.length === 0) {
    lines.push("No risk findings across checked trace surfaces.", "");
  } else {
    const grouped = groupFindingsBySeverity(manifest.findings);
    for (const severity of severityOrder) {
      const findings = grouped.get(severity) ?? [];
      if (findings.length === 0) continue;
      lines.push(`### ${severity}`, "");
      for (const finding of findings) {
        lines.push(`#### ${finding.title}`, "");
        lines.push(finding.detail, "");
        if (finding.evidence) {
          lines.push("Evidence:", "", codeFence(finding.evidence), "");
        }
        lines.push(`Suggested action: ${finding.suggestion}`, "");
      }
    }
  }

  lines.push("## Git Diff Stat", "");
  lines.push(codeFence(manifest.gitAfter.diffStat || "No tracked diff after run."), "");
  lines.push("## Output Files", "");
  lines.push(`- stdout: \`${manifest.files.stdout}\``);
  lines.push(`- stderr: \`${manifest.files.stderr}\``);
  lines.push(`- diff: \`${manifest.files.diff}\``);
  lines.push(`- manifest: \`${manifest.files.json}\``);
  lines.push(`- markdown: \`${manifest.files.markdown}\``);
  lines.push(`- html: \`${manifest.files.html}\``);
  return `${lines.join("\n")}\n`;
}

export function renderHtmlReport(manifest: TraceManifest): string {
  const findings = renderHtmlFindings(manifest.findings);
  const command = manifest.command.join(" ");
  const diffStat = manifest.gitAfter.diffStat || "No tracked diff after run.";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Agent Run Trace ${escapeHtml(manifest.traceId)}</title>
  <style>
    :root { --ink:#181714; --paper:#f7f8fb; --panel:#fff; --line:#d8dee8; --blue:#315f9f; --red:#b42318; --amber:#b46917; --green:#1f7a5b; --muted:#526071; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:var(--paper); }
    main { width:min(1080px, calc(100% - 32px)); margin:0 auto; padding:40px 0; }
    h1 { font-size: 44px; line-height:1.05; margin:0 0 16px; }
    h2 { margin:32px 0 12px; }
    h3 { margin:0 0 12px; }
    h4 { margin:8px 0; }
    code, pre, .mono { font-family: ui-monospace, Consolas, monospace; }
    .panel { background:var(--panel); border:3px solid var(--ink); padding:24px; box-shadow:10px 10px 0 #c8d4e8; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:24px 0; }
    .metric, .finding { background:var(--panel); border:1px solid var(--line); padding:18px; }
    .metric b { display:block; font-size:13px; color:var(--muted); text-transform:uppercase; }
    .metric span { display:block; margin-top:6px; font-size:22px; color:var(--blue); overflow-wrap:anywhere; }
    .section { background:var(--panel); border:1px solid var(--line); padding:18px; margin:16px 0; }
    .summary-list { display:grid; grid-template-columns:max-content 1fr; gap:8px 16px; margin:0; }
    .summary-list dt { color:var(--muted); font-weight:700; }
    .summary-list dd { margin:0; overflow-wrap:anywhere; }
    .file-list { margin:0; padding-left:20px; }
    .file-list li { margin:6px 0; overflow-wrap:anywhere; }
    .severity-group { margin:18px 0; }
    .finding b { color:var(--amber); }
    .finding.p0 { border-left:5px solid var(--red); }
    .finding.p1 { border-left:5px solid var(--amber); }
    .finding.p2 { border-left:5px solid var(--blue); }
    .finding.p3 { border-left:5px solid var(--green); }
    .finding.p0 b { color:var(--red); }
    .finding + .finding { margin-top:12px; }
    .quiet { color:var(--muted); }
    pre { overflow:auto; background:#181714; color:#f7f8fb; padding:16px; border-radius:4px; }
    @media (max-width: 760px) {
      main { width:min(100% - 20px, 1080px); padding:24px 0; }
      h1 { font-size:32px; }
      .grid, .summary-list { grid-template-columns:1fr; }
      .panel { box-shadow:none; }
    }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <div class="mono">agent-run-trace-pack</div>
      <h1>Agent Run Trace</h1>
      <p class="quiet">Trace ${escapeHtml(manifest.traceId)}</p>
    </section>
    <section class="grid">
      <div class="metric"><b>Exit or signal</b><span>${escapeHtml(formatExitOrSignal(manifest))}</span></div>
      <div class="metric"><b>Duration</b><span>${escapeHtml(String(manifest.durationMs))}ms</span></div>
      <div class="metric"><b>Findings</b><span>${manifest.findings.length}</span></div>
    </section>
    <section class="section">
      <h2>Trace Summary</h2>
      <dl class="summary-list">
        <dt>Working directory</dt><dd><code>${escapeHtml(manifest.cwd)}</code></dd>
        <dt>Started</dt><dd><code>${escapeHtml(manifest.startedAt)}</code></dd>
        <dt>Ended</dt><dd><code>${escapeHtml(manifest.endedAt)}</code></dd>
      </dl>
      <h3>Command</h3>
      <pre>${escapeHtml(command)}</pre>
    </section>
    <section class="grid">
      ${renderHtmlGitSnapshot("Git Before", manifest.gitBefore)}
      ${renderHtmlGitSnapshot("Git After", manifest.gitAfter)}
      <div class="metric"><b>Output files</b><span>${Object.keys(manifest.files).length}</span></div>
    </section>
    <section>
      <h2>Findings by Severity</h2>
      ${findings}
    </section>
    <section>
      <h2>Git Diff Stat</h2>
      <pre>${escapeHtml(diffStat)}</pre>
    </section>
    <section class="section">
      <h2>Output Files</h2>
      <ul class="file-list">
        <li>stdout: <code>${escapeHtml(manifest.files.stdout)}</code></li>
        <li>stderr: <code>${escapeHtml(manifest.files.stderr)}</code></li>
        <li>diff: <code>${escapeHtml(manifest.files.diff)}</code></li>
        <li>manifest: <code>${escapeHtml(manifest.files.json)}</code></li>
        <li>markdown: <code>${escapeHtml(manifest.files.markdown)}</code></li>
        <li>html: <code>${escapeHtml(manifest.files.html)}</code></li>
      </ul>
    </section>
  </main>
</body>
</html>
`;
}

function renderMarkdownGitSnapshot(snapshot: GitSnapshot): string[] {
  return [
    `- Available: \`${String(snapshot.available)}\``,
    `- Root: \`${snapshot.root ?? "unknown"}\``,
    `- Branch: \`${snapshot.branch ?? "unknown"}\``,
    `- Head: \`${snapshot.head ?? "unknown"}\``,
    `- Status: \`${snapshot.status ?? "unknown"}\``
  ];
}

function renderHtmlGitSnapshot(title: string, snapshot: GitSnapshot): string {
  return `<div class="metric"><b>${escapeHtml(title)}</b><span>${escapeHtml(snapshot.head ?? "unknown")}</span><small>branch: ${escapeHtml(snapshot.branch ?? "unknown")}<br>status: ${escapeHtml(snapshot.status ?? "unknown")}</small></div>`;
}

function renderHtmlFindings(findings: RiskFinding[]): string {
  if (findings.length === 0) return `<p class="quiet">No risk findings across checked trace surfaces.</p>`;

  const grouped = groupFindingsBySeverity(findings);
  return severityOrder
    .map((severity) => {
      const severityFindings = grouped.get(severity) ?? [];
      if (severityFindings.length === 0) return "";
      const articles = severityFindings
        .map((finding) => {
          const evidence = finding.evidence
            ? `<h4>Evidence</h4><pre>${escapeHtml(finding.evidence)}</pre>`
            : "";
          return `<article class="finding ${finding.severity.toLowerCase()}"><b>${escapeHtml(finding.severity)}</b><h4>${escapeHtml(finding.title)}</h4><p>${escapeHtml(finding.detail)}</p>${evidence}<p><strong>Suggested action:</strong> ${escapeHtml(finding.suggestion)}</p></article>`;
        })
        .join("\n");
      return `<div class="severity-group"><h3>${escapeHtml(severity)}</h3>\n${articles}</div>`;
    })
    .filter(Boolean)
    .join("\n");
}

function groupFindingsBySeverity(findings: RiskFinding[]): Map<Severity, RiskFinding[]> {
  const grouped = new Map<Severity, RiskFinding[]>();
  for (const finding of findings) {
    grouped.set(finding.severity, [...(grouped.get(finding.severity) ?? []), finding]);
  }
  return grouped;
}

function formatExitOrSignal(manifest: TraceManifest): string {
  if (manifest.exitCode !== null) return `exit ${manifest.exitCode}`;
  return manifest.signal ? `signal ${manifest.signal}` : "signal unknown";
}

function codeFence(value: string): string {
  const matches = value.match(/`+/g) ?? [];
  const longestRun = Math.max(2, ...matches.map((match) => match.length));
  const fence = "`".repeat(longestRun + 1);
  return `${fence}text\n${value}\n${fence}`;
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
