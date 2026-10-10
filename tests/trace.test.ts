import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { runTrace } from "../src/core/trace.js";

describe("trace runner", () => {
  it("explains a missing executable without inventing an exit code or signal", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-missing-"));
    const syntheticToken = ["ghp", "syntheticMissingToken1234567890"].join("_");
    const { manifest, traceDir } = runTrace({
      cwd,
      outDir: ".traces",
      command: [path.join(cwd, "absent-command"), syntheticToken]
    });

    expect(manifest).toMatchObject({ exitCode: null, signal: null, executionError: { code: "ENOENT" } });
    expect(manifest.findings.some((finding) => finding.id === "execution-error")).toBe(true);
    for (const file of ["manifest.json", "report.md", "report.html"]) {
      const text = fs.readFileSync(path.join(traceDir, file), "utf8");
      expect(text).toContain("ENOENT");
      expect(text).not.toContain("signal unknown");
      expect(text).not.toContain(syntheticToken);
      expect(text).not.toContain("spawnargs");
    }
  }, 30000);

  it("marks output-limit termination and incomplete capture", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-buffer-"));
    const { manifest, traceDir } = runTrace({
      cwd,
      outDir: ".traces",
      command: [process.execPath, "-e", "process.stdout.write('x'.repeat(2 * 1024 * 1024))"]
    });

    expect(manifest).toMatchObject({ executionError: { code: "ENOBUFS" } });
    expect(manifest.findings.some((finding) => finding.id === "execution-error")).toBe(true);
    for (const file of ["report.md", "report.html"]) {
      const text = fs.readFileSync(path.join(traceDir, file), "utf8");
      expect(text).toContain("ENOBUFS");
      expect(text).toContain("incomplete");
    }
  }, 30000);

  it("writes a redacted trace pack", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-"));
    const githubToken = ["ghp", "1234567890abcdefghijklmnop"].join("_");
    const { manifest, traceDir } = runTrace({
      cwd,
      outDir: ".traces",
      command: [process.execPath, "-e", `console.log('token=${githubToken}')`]
    });

    expect(manifest.exitCode).toBe(0);
    expect(fs.existsSync(path.join(traceDir, "manifest.json"))).toBe(true);
    expect(fs.readFileSync(path.join(traceDir, "stdout.log"), "utf8")).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(manifest.findings.some((finding) => finding.id === "secret-like-output")).toBe(true);
  }, 30000);

  it("redacts stdout, stderr, diff, manifest, and reports before persistence", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-redact-"));
    const githubToken = ["ghp", "syntheticTraceToken1234567890"].join("_");
    const openAiKey = ["sk", "syntheticTraceOpenAIKey1234567890"].join("-");
    const authUrl = "https://trace-user:trace-pass@example.invalid/private";
    const rawValues = [githubToken, openAiKey, authUrl];

    runGit(cwd, ["init"]);
    fs.writeFileSync(path.join(cwd, "tracked.txt"), "baseline\n");
    runGit(cwd, ["add", "tracked.txt"]);

    const script = [
      "const fs = require('node:fs');",
      `fs.writeFileSync('tracked.txt', 'diff token=${githubToken}\\nauth ${authUrl}\\n');`,
      `console.log('stdout token=${openAiKey}');`,
      `console.error('stderr url=${authUrl}');`,
      `console.log('npm publish token=${githubToken}');`
    ].join("");

    const { manifest, traceDir } = runTrace({
      cwd,
      outDir: ".traces",
      command: [process.execPath, "-e", script]
    });

    expect(manifest.findings.some((finding) => finding.id === "public-publish")).toBe(true);
    expect(manifest.command.join(" ")).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(manifest.command.join(" ")).toContain("[REDACTED_AUTH_URL]");

    const persisted = [
      "stdout.log",
      "stderr.log",
      "diff.patch",
      "manifest.json",
      "report.md",
      "report.html"
    ].map((file) => fs.readFileSync(path.join(traceDir, file), "utf8"));

    for (const text of persisted) {
      for (const rawValue of rawValues) expect(text).not.toContain(rawValue);
    }

    expect(fs.readFileSync(path.join(traceDir, "stdout.log"), "utf8")).toContain("[REDACTED_OPENAI_KEY]");
    expect(fs.readFileSync(path.join(traceDir, "stderr.log"), "utf8")).toContain("[REDACTED_AUTH_URL]");
    expect(fs.readFileSync(path.join(traceDir, "diff.patch"), "utf8")).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(fs.readFileSync(path.join(traceDir, "report.md"), "utf8")).toContain("[REDACTED_GITHUB_TOKEN]");
  }, 30000);
});

function runGit(cwd: string, args: string[]): void {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
}
