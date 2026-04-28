#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const input = process.argv[2] ?? ".tmp/smoke";
const target = path.resolve(process.cwd(), input);
const traceDir = findTraceDir(target);
const problems = [];

if (!traceDir) {
  fail([`no trace directory found under ${input}`]);
}

const manifestPath = path.join(traceDir, "manifest.json");
const requiredFiles = ["manifest.json", "stdout.log", "stderr.log", "diff.patch", "report.md", "report.html"];
const manifestFileFields = {
  stdout: "stdout.log",
  stderr: "stderr.log",
  diff: "diff.patch",
  markdown: "report.md",
  html: "report.html",
  json: "manifest.json"
};

for (const file of requiredFiles) {
  const full = path.join(traceDir, file);
  if (!fs.existsSync(full)) problems.push(`missing artifact ${path.relative(process.cwd(), full)}`);
  else if (!fs.statSync(full).isFile()) problems.push(`invalid artifact ${path.relative(process.cwd(), full)} is not a file`);
}

let manifest;
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    problems.push(`manifest.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (manifest) {
  if (manifest.schemaVersion !== 1) problems.push("manifest.schemaVersion must be 1");
  if (manifest.tool !== "agent-run-trace-pack") problems.push("manifest.tool must be agent-run-trace-pack");
  if (!Array.isArray(manifest.command) || manifest.command.length === 0) problems.push("manifest.command must be a non-empty array");
  if (typeof manifest.durationMs !== "number") problems.push("manifest.durationMs must be a number");
  if (manifest.exitCode !== 0) problems.push(`smoke trace exitCode should be 0, got ${manifest.exitCode}`);
  if (!manifest.files || typeof manifest.files !== "object") {
    problems.push("manifest.files must describe trace artifact filenames");
  } else {
    for (const [key, expected] of Object.entries(manifestFileFields)) {
      if (manifest.files[key] !== expected) problems.push(`manifest.files.${key} must be ${expected}`);
    }
  }
}

if (fs.existsSync(path.join(traceDir, "report.md"))) {
  const report = fs.readFileSync(path.join(traceDir, "report.md"), "utf8");
  if (!report.includes("# Agent Run Trace")) problems.push("report.md is missing the Agent Run Trace heading");
}

if (fs.existsSync(path.join(traceDir, "report.html"))) {
  const html = fs.readFileSync(path.join(traceDir, "report.html"), "utf8");
  if (!html.includes("<title>Agent Run Trace")) problems.push("report.html is missing the trace title");
  if (/<script\b/i.test(html)) problems.push("report.html must not include script tags");
}

if (problems.length > 0) fail(problems);

console.log("trace validation: ok");
console.log(`- trace: ${path.relative(process.cwd(), traceDir)}`);
for (const file of requiredFiles) console.log(`- ${file}: present`);

function findTraceDir(candidate) {
  if (!fs.existsSync(candidate)) return undefined;
  const stat = fs.statSync(candidate);
  if (stat.isDirectory() && fs.existsSync(path.join(candidate, "manifest.json"))) return candidate;
  if (!stat.isDirectory()) return undefined;

  const dirs = fs
    .readdirSync(candidate, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(candidate, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, "manifest.json")))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  return dirs[0];
}

function fail(messages) {
  console.error("trace validation: failed");
  for (const message of messages) console.error(`- ${message}`);
  process.exit(1);
}
