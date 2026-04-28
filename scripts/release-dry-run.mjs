#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "dist/cli.js",
  "docs/index.html",
  "docs/examples.md",
  "docs/launch-kit.md",
  "docs/release-readiness.md",
  "assets/social-preview.png"
];
const forbiddenPackagePathPatterns = [
  /^\.tmp\//,
  /^\.agent-traces\//,
  /^node_modules\//,
  /^coverage\//,
  /^scripts\/ralph\//
];

const result = spawnSync("npm", ["pack", "--json", "--dry-run"], {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: process.platform === "win32",
  windowsHide: true
});

if (result.status !== 0) {
  if (result.stdout.trim()) console.error(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  process.exit(result.status ?? 1);
}

const pack = JSON.parse(result.stdout.trim());
const entry = Array.isArray(pack) ? pack[0] : undefined;
if (!entry || !Array.isArray(entry.files)) {
  console.error("release dry run: npm pack JSON did not include a file list");
  process.exit(1);
}

const packedFiles = new Set(entry.files.map((file) => String(file.path).replace(/^package\//, "")));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));
if (missing.length > 0) {
  console.error("release dry run: missing required files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const forbidden = [...packedFiles].filter((file) => forbiddenPackagePathPatterns.some((pattern) => pattern.test(file)));
if (forbidden.length > 0) {
  console.error("release dry run: package preview includes forbidden generated or private paths:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

if (entry.name !== "agent-run-trace-pack") {
  console.error(`release dry run: package name should be agent-run-trace-pack, got ${entry.name}`);
  process.exit(1);
}

if (typeof entry.version !== "string" || entry.version.length === 0) {
  console.error("release dry run: package version is missing");
  process.exit(1);
}

console.log("release dry run: ok");
console.log(`- package: ${entry.name}@${entry.version}`);
console.log(`- files: ${entry.files.length}`);
