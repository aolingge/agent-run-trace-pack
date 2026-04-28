#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { runTrace } from "./core/trace.js";
import { captureGitSnapshot } from "./core/git.js";

const version = "0.1.1";

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(version);
    return 0;
  }

  if (command === "run") return runCommand(rest);
  if (command === "doctor") return doctor(rest);
  if (command === "init") return init(rest);
  if (command === "summarize") return summarize(rest);

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 1;
}

function runCommand(args: string[]): number {
  const separator = args.indexOf("--");
  if (separator === -1) {
    console.error("Missing -- before wrapped command.");
    return 1;
  }

  const optionArgs = args.slice(0, separator);
  const wrappedCommand = args.slice(separator + 1);
  let outDir = ".agent-traces";
  let cwd = process.cwd();

  for (let index = 0; index < optionArgs.length; index++) {
    const arg = optionArgs[index];
    if (arg === "--out") outDir = requireValue(optionArgs, ++index, "--out");
    else if (arg === "--cwd") cwd = path.resolve(requireValue(optionArgs, ++index, "--cwd"));
    else throw new Error(`Unknown run option: ${arg}`);
  }

  const { manifest, traceDir } = runTrace({ cwd, outDir, command: wrappedCommand });
  console.log(`Agent Run Trace Pack ${version}`);
  console.log(`Trace ${manifest.traceId} | exit ${manifest.exitCode ?? "signal"} | findings ${manifest.findings.length}`);
  console.log(`Report: ${path.relative(process.cwd(), path.join(traceDir, "report.md"))}`);
  console.log(`HTML: ${path.relative(process.cwd(), path.join(traceDir, "report.html"))}`);
  return manifest.exitCode ?? 1;
}

function doctor(_args: string[]): number {
  const git = captureGitSnapshot(process.cwd());
  console.log(`Agent Run Trace Pack ${version}`);
  console.log(`Node: ${process.version}`);
  console.log(`Git: ${git.available ? "available" : "not detected"}`);
  if (git.available) {
    console.log(`Git root: ${git.root}`);
    console.log(`Git head: ${git.head ?? "unknown"}`);
  }
  return 0;
}

function init(_args: string[]): number {
  const file = path.join(process.cwd(), "agent-run-trace.config.json");
  if (fs.existsSync(file)) {
    console.log("agent-run-trace.config.json already exists");
    return 0;
  }
  fs.writeFileSync(
    file,
    `${JSON.stringify(
      {
        outDir: ".agent-traces",
        redact: true,
        keepDiff: true
      },
      null,
      2
    )}\n`
  );
  console.log("Created agent-run-trace.config.json");
  return 0;
}

function summarize(args: string[]): number {
  const traceDir = path.resolve(args[0] ?? ".");
  const manifestPath = path.join(traceDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`No manifest.json found in ${traceDir}`);
    return 1;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    traceId: string;
    command: string[];
    exitCode: number | null;
    durationMs: number;
    findings: unknown[];
  };
  console.log(`Trace ${manifest.traceId}`);
  console.log(`Command: ${manifest.command.join(" ")}`);
  console.log(`Exit: ${manifest.exitCode ?? "signal"}`);
  console.log(`Duration: ${manifest.durationMs}ms`);
  console.log(`Findings: ${manifest.findings.length}`);
  return 0;
}

function requireValue(args: string[], index: number, name: string): string {
  const value = args[index];
  if (!value) throw new Error(`${name} requires a value`);
  return value;
}

function printHelp(): void {
  console.log(`Agent Run Trace Pack ${version}

Usage:
  agent-run-trace-pack run [--out .agent-traces] [--cwd path] -- <command...>
  agent-run-trace-pack summarize <trace-dir>
  agent-run-trace-pack doctor
  agent-run-trace-pack init

Examples:
  artrace run -- npm test
  artrace run --out .tmp/traces -- codex --help
  artrace summarize .agent-traces/2026-04-28T10-00-00-000Z
`);
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && path.resolve(entry) === fileURLToPath(import.meta.url));
}

if (isDirectRun()) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
