import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli.js";

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function invokeCli(args: string[]): Promise<CliResult> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...values: unknown[]) => {
    stdout.push(values.map(String).join(" "));
  };
  console.error = (...values: unknown[]) => {
    stderr.push(values.map(String).join(" "));
  };

  try {
    return {
      code: await main(args),
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n")
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

async function withTempDir<T>(callback: (cwd: string) => Promise<T>): Promise<T> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-cli-"));

  try {
    return await callback(cwd);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

async function withTempCwd<T>(callback: (cwd: string) => Promise<T>): Promise<T> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "agent-run-trace-cli-"));
  const previous = process.cwd();

  try {
    process.chdir(cwd);
    return await callback(cwd);
  } finally {
    process.chdir(previous);
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

function singleTraceDir(root: string, outDir: string): string {
  const fullOutDir = path.join(root, outDir);
  const entries = fs.readdirSync(fullOutDir);
  expect(entries).toHaveLength(1);
  return path.join(fullOutDir, entries[0]);
}

describe("CLI behavior", () => {
  it("runs a local synthetic command and summarizes the trace", async () => {
    await withTempDir(async (cwd) => {
      const run = await invokeCli([
        "run",
        "--out",
        ".traces",
        "--cwd",
        cwd,
        "--",
        process.execPath,
        "-e",
        "console.log('cli run ok')"
      ]);

      expect(run.code).toBe(0);
      expect(run.stdout).toContain("Agent Run Trace Pack 0.1.0");
      expect(run.stdout).toContain("Report:");

      const traceDir = singleTraceDir(cwd, ".traces");
      const summary = await invokeCli(["summarize", traceDir]);

      expect(summary.code).toBe(0);
      expect(summary.stdout).toContain("Trace ");
      expect(summary.stdout).toContain("Exit: 0");
      expect(summary.stdout).toContain(process.execPath);
    });
  });

  it("returns the wrapped command exit code for nonzero runs", async () => {
    await withTempDir(async (cwd) => {
      const result = await invokeCli([
        "run",
        "--out",
        ".traces",
        "--cwd",
        cwd,
        "--",
        process.execPath,
        "-e",
        "process.exit(7)"
      ]);

      expect(result.code).toBe(7);

      const manifest = JSON.parse(
        fs.readFileSync(path.join(singleTraceDir(cwd, ".traces"), "manifest.json"), "utf8")
      ) as { exitCode: number };
      expect(manifest.exitCode).toBe(7);
    });
  });

  it("prints doctor information without network or credentials", async () => {
    const result = await invokeCli(["doctor"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Agent Run Trace Pack 0.1.0");
    expect(result.stdout).toContain("Node:");
    expect(result.stdout).toContain("Git:");
  });

  it("initializes the local config file", async () => {
    await withTempCwd(async (cwd) => {
      const result = await invokeCli(["init"]);
      const configPath = path.join(cwd, "agent-run-trace.config.json");

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Created agent-run-trace.config.json");
      expect(JSON.parse(fs.readFileSync(configPath, "utf8"))).toEqual({
        outDir: ".agent-traces",
        redact: true,
        keepDiff: true
      });
    });
  });

  it("rejects run without the command separator", async () => {
    const result = await invokeCli(["run", process.execPath, "-e", "console.log('missing separator')"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Missing -- before wrapped command.");
  });

  it("rejects unknown commands", async () => {
    const result = await invokeCli(["unknown"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown command: unknown");
    expect(result.stdout).toContain("Usage:");
  });
});
