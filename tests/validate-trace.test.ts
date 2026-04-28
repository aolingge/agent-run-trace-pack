import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "validate-trace.mjs");

describe("trace validation script", () => {
  it("accepts a complete local trace pack", () => {
    const cwd = makeTraceRoot();

    try {
      const result = runValidator(cwd, ".");

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("trace validation: ok");
      expect(result.stdout).toContain("manifest.json: present");
      expect(result.stderr).toBe("");
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("prints actionable artifact names when validation fails", () => {
    const cwd = makeTraceRoot();
    fs.rmSync(path.join(cwd, "trace", "stdout.log"));

    try {
      const result = runValidator(cwd, ".");

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("trace validation: failed");
      expect(result.stderr).toContain("missing artifact trace");
      expect(result.stderr).toContain("stdout.log");
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
});

function makeTraceRoot(): string {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-validate-"));
  const traceDir = path.join(cwd, "trace");
  fs.mkdirSync(traceDir);

  fs.writeFileSync(path.join(traceDir, "stdout.log"), "trace smoke\n");
  fs.writeFileSync(path.join(traceDir, "stderr.log"), "");
  fs.writeFileSync(path.join(traceDir, "diff.patch"), "");
  fs.writeFileSync(path.join(traceDir, "report.md"), "# Agent Run Trace\n");
  fs.writeFileSync(path.join(traceDir, "report.html"), "<!doctype html><title>Agent Run Trace</title>");
  fs.writeFileSync(
    path.join(traceDir, "manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        tool: "agent-run-trace-pack",
        traceId: "trace",
        command: [process.execPath, "-e", "console.log('trace smoke')"],
        durationMs: 1,
        exitCode: 0,
        files: {
          stdout: "stdout.log",
          stderr: "stderr.log",
          diff: "diff.patch",
          markdown: "report.md",
          html: "report.html",
          json: "manifest.json"
        }
      },
      null,
      2
    )}\n`
  );

  return cwd;
}

function runValidator(cwd: string, target: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [script, target], {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  };
}
