export type Severity = "P0" | "P1" | "P2" | "P3";

export interface RiskFinding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
  suggestion: string;
}

export interface GitSnapshot {
  available: boolean;
  root?: string;
  head?: string;
  branch?: string;
  status?: string;
  diffStat?: string;
}

export interface TraceManifest {
  schemaVersion: 1;
  tool: "agent-run-trace-pack";
  traceId: string;
  command: string[];
  cwd: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  gitBefore: GitSnapshot;
  gitAfter: GitSnapshot;
  findings: RiskFinding[];
  files: {
    stdout: string;
    stderr: string;
    diff: string;
    markdown: string;
    html: string;
    json: string;
  };
}

export interface RunOptions {
  cwd: string;
  outDir: string;
  command: string[];
}

export interface RunResult {
  manifest: TraceManifest;
  traceDir: string;
}
