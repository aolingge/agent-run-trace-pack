import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
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
});
