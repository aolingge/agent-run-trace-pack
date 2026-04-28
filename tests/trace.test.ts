import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { runTrace } from "../src/core/trace.js";

describe("trace runner", () => {
  it("writes a redacted trace pack", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-"));
    const { manifest, traceDir } = runTrace({
      cwd,
      outDir: ".traces",
      command: [process.execPath, "-e", "console.log('token=ghp_1234567890abcdefghijklmnop')"]
    });

    expect(manifest.exitCode).toBe(0);
    expect(fs.existsSync(path.join(traceDir, "manifest.json"))).toBe(true);
    expect(fs.readFileSync(path.join(traceDir, "stdout.log"), "utf8")).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(manifest.findings.some((finding) => finding.id === "secret-like-output")).toBe(true);
  });

  it("redacts stdout, stderr, diff, manifest, and reports before persistence", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-redact-"));
    const githubToken = "ghp_syntheticTraceToken1234567890";
    const openAiKey = "sk-syntheticTraceOpenAIKey1234567890";
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
  });
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
