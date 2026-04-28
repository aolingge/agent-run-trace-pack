import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderHtmlReport, renderMarkdownReport } from "../src/report/render.js";
import type { TraceManifest } from "../src/types.js";

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

function loadReportManifest(): TraceManifest {
  const raw = fs.readFileSync(path.join(fixtureRoot, "report-manifest.json"), "utf8");
  return JSON.parse(raw) as TraceManifest;
}

describe("report rendering", () => {
  it("matches committed Markdown and HTML report fixtures", () => {
    const manifest = loadReportManifest();
    const expectedMarkdown = fs.readFileSync(path.join(fixtureRoot, "expected-reports", "report.md"), "utf8");
    const expectedHtml = fs.readFileSync(path.join(fixtureRoot, "expected-reports", "report.html"), "utf8");

    expect(renderMarkdownReport(manifest)).toBe(expectedMarkdown);
    expect(renderHtmlReport(manifest)).toBe(expectedHtml);
  });

  it("escapes command, finding, and diff content in static local HTML", () => {
    const html = renderHtmlReport(loadReportManifest());

    expect(html).toContain("console.log(&quot;&lt;ok&gt;&quot;)");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain("&lt;diff-check&gt;");
    expect(html).not.toContain("console.log(\"<ok>\")");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<diff-check>");
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/\s(?:src|href)=["']https?:/i);
  });
});
