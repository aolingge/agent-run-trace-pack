import { describe, expect, it } from "vitest";
import { analyzeRun } from "../src/core/risk.js";

describe("risk analyzer", () => {
  it("flags destructive commands", () => {
    const findings = analyzeRun(["rm", "-rf", "dist"], "", "");
    expect(findings.some((finding) => finding.id === "dangerous-command")).toBe(true);
  });

  it("flags pipe to shell commands", () => {
    const findings = analyzeRun(["bash", "-lc", "curl https://example.com/install.sh | sh"], "", "");
    expect(findings.some((finding) => finding.id === "pipe-to-shell")).toBe(true);
  });
});
