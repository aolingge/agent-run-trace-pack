import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { RunOptions, RunResult, TraceManifest } from "../types.js";
import { captureGitDiff, captureGitSnapshot } from "./git.js";
import { redactText } from "./redact.js";
import { analyzeRun } from "./risk.js";
import { renderHtmlReport, renderMarkdownReport } from "../report/render.js";
import { resolveCommand } from "./shell.js";

export function runTrace(options: RunOptions): RunResult {
  if (options.command.length === 0) throw new Error("No command provided after --");

  const startedAtDate = new Date();
  const traceId = toTraceId(startedAtDate);
  const traceDir = path.resolve(options.cwd, options.outDir, traceId);
  fs.mkdirSync(traceDir, { recursive: true });

  const gitBefore = captureGitSnapshot(options.cwd);
  const command = options.command;
  const result = spawnSync(resolveCommand(command[0]), command.slice(1), {
    cwd: options.cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  const endedAtDate = new Date();
  const stdout = redactText(result.stdout ?? "");
  const stderr = redactText(result.stderr ?? "");
  const diff = redactText(captureGitDiff(options.cwd));
  const gitAfter = captureGitSnapshot(options.cwd);
  const findings = analyzeRun(command, result.stdout ?? "", result.stderr ?? "").map((finding) => ({
    ...finding,
    evidence: finding.evidence ? redactText(finding.evidence) : undefined
  }));
  const redactedCommand = command.map((part) => redactText(part));

  fs.writeFileSync(path.join(traceDir, "stdout.log"), stdout);
  fs.writeFileSync(path.join(traceDir, "stderr.log"), stderr);
  fs.writeFileSync(path.join(traceDir, "diff.patch"), diff);

  const manifest: TraceManifest = {
    schemaVersion: 1,
    tool: "agent-run-trace-pack",
    traceId,
    command: redactedCommand,
    cwd: options.cwd,
    startedAt: startedAtDate.toISOString(),
    endedAt: endedAtDate.toISOString(),
    durationMs: endedAtDate.getTime() - startedAtDate.getTime(),
    exitCode: result.status,
    signal: result.signal,
    gitBefore,
    gitAfter,
    findings,
    files: {
      stdout: "stdout.log",
      stderr: "stderr.log",
      diff: "diff.patch",
      markdown: "report.md",
      html: "report.html",
      json: "manifest.json"
    }
  };

  fs.writeFileSync(path.join(traceDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(traceDir, "report.md"), renderMarkdownReport(manifest));
  fs.writeFileSync(path.join(traceDir, "report.html"), renderHtmlReport(manifest));

  return { manifest, traceDir };
}

function toTraceId(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}
