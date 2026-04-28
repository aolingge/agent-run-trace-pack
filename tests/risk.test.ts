import { describe, expect, it } from "vitest";
import { analyzeRun } from "../src/core/risk.js";

describe("risk analyzer", () => {
  it("flags destructive commands", () => {
    const commands = [
      ["rm", "-rf", "dist"],
      ["powershell", "-NoProfile", "-Command", "Remove-Item -Recurse dist"],
      ["git", "reset", "--hard"]
    ];

    for (const command of commands) {
      const findings = analyzeRun(command, "", "");
      expect(findings.some((finding) => finding.id === "dangerous-command")).toBe(true);
    }
  });

  it("flags publish and release commands", () => {
    const commands = [
      ["npm", "publish"],
      ["gh", "release", "create", "v0.1.0"],
      ["docker", "push", "example/app"]
    ];

    for (const command of commands) {
      const findings = analyzeRun(command, "", "");
      expect(findings.some((finding) => finding.id === "public-publish")).toBe(true);
    }
  });

  it("flags pipe to shell commands", () => {
    const commands = [
      ["bash", "-lc", "curl https://example.invalid/install.sh | sh"],
      ["pwsh", "-Command", "wget https://example.invalid/install.ps1 | powershell"]
    ];

    for (const command of commands) {
      const findings = analyzeRun(command, "", "");
      expect(findings.some((finding) => finding.id === "pipe-to-shell")).toBe(true);
    }
  });

  it("flags permission failure variants", () => {
    const outputs = [
      "Permission denied: open '/synthetic/cache'",
      "Access denied while writing synthetic output",
      "EPERM: operation not permitted, mkdir '/synthetic/cache'",
      "EACCES: permission denied, open '/synthetic/cache'"
    ];

    for (const output of outputs) {
      const findings = analyzeRun(["node", "synthetic.js"], "", output);
      expect(findings.some((finding) => finding.id === "permission-failure")).toBe(true);
    }
  });

  it("flags secret-like output", () => {
    const githubToken = ["ghp", "syntheticRiskToken1234567890"].join("_");
    const password = ["synthetic", "Password", "1234567890"].join("");
    const findings = analyzeRun(
      ["node", "synthetic.js"],
      `token=${githubToken}\n`,
      `password=${password}\n`
    );

    expect(findings.some((finding) => finding.id === "secret-like-output")).toBe(true);
  });
});
