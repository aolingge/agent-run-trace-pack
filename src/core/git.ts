import { runQuiet } from "./shell.js";
import type { GitSnapshot } from "../types.js";

export function captureGitSnapshot(cwd: string): GitSnapshot {
  const root = runQuiet("git", ["rev-parse", "--show-toplevel"], cwd);
  if (root.status !== 0) return { available: false };

  const head = runQuiet("git", ["rev-parse", "--short", "HEAD"], cwd);
  const branch = runQuiet("git", ["branch", "--show-current"], cwd);
  const status = runQuiet("git", ["status", "--short"], cwd);
  const diffStat = runQuiet("git", ["diff", "--stat"], cwd);

  return {
    available: true,
    root: root.stdout.trim(),
    head: head.stdout.trim() || undefined,
    branch: branch.stdout.trim() || undefined,
    status: status.stdout.trim(),
    diffStat: diffStat.stdout.trim()
  };
}

export function captureGitDiff(cwd: string): string {
  const diff = runQuiet("git", ["diff", "--binary"], cwd);
  return diff.status === 0 ? diff.stdout : "";
}
