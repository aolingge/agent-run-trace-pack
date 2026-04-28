import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { redactText } from "../src/core/redact.js";
import { analyzeRun } from "../src/core/risk.js";

interface SyntheticTraceFixture {
  id: string;
  title: string;
  source: "synthetic";
  command: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  diff: string;
  expectedFindingIds: string[];
  expectedRedactedTextIncludes: string[];
  expectedRedactedTextExcludes: string[];
}

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "synthetic-traces");
const syntheticValues = {
  githubToken: ["ghp", "syntheticTokenValue1234567890"].join("_")
};

function loadSyntheticTraceFixtures(): SyntheticTraceFixture[] {
  return fs
    .readdirSync(fixtureRoot)
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => {
      const raw = fs.readFileSync(path.join(fixtureRoot, entry), "utf8");
      return JSON.parse(expandSyntheticPlaceholders(raw)) as SyntheticTraceFixture;
    });
}

function expandSyntheticPlaceholders(raw: string): string {
  return raw.replaceAll("<SYNTHETIC_GITHUB_TOKEN_LIKE>", syntheticValues.githubToken);
}

describe("synthetic trace fixtures", () => {
  it("cover the required launch scenarios", () => {
    const ids = loadSyntheticTraceFixtures().map((fixture) => fixture.id);

    expect(ids).toEqual(["success", "command-failure", "secret-like-output", "permission-failure", "git-diff"]);
  });

  it("are local deterministic fixture data", () => {
    for (const fixture of loadSyntheticTraceFixtures()) {
      expect(fixture.source).toBe("synthetic");
      expect(fixture.command.length).toBeGreaterThan(0);
      expect(fixture.command.join(" ")).not.toMatch(/\b(?:curl|wget)\b|https?:\/\//i);
      expect(`${fixture.stdout}\n${fixture.stderr}\n${fixture.diff}`).not.toMatch(
        /https?:\/\/[^/\s:@]+:[^@\s]+@/i
      );
    }
  });

  it("matches risk and redaction expectations", () => {
    for (const fixture of loadSyntheticTraceFixtures()) {
      const findings = analyzeRun(fixture.command, fixture.stdout, fixture.stderr).map((finding) => finding.id);
      const redactedText = redactText(`${fixture.stdout}\n${fixture.stderr}\n${fixture.diff}`);

      expect(findings.sort()).toEqual([...fixture.expectedFindingIds].sort());
      for (const expected of fixture.expectedRedactedTextIncludes) expect(redactedText).toContain(expected);
      for (const expected of fixture.expectedRedactedTextExcludes) expect(redactedText).not.toContain(expected);
    }
  });
});
