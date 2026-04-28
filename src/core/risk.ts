import type { RiskFinding } from "../types.js";
import { containsSecretLikeValue } from "./redact.js";

const destructivePatterns = [
  /\brm\s+-rf\b/i,
  /\bRemove-Item\b.*-Recurse\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgh\s+repo\s+delete\b/i
];

const publishPatterns = [
  /\bnpm\s+publish\b/i,
  /\bgh\s+release\s+create\b/i,
  /\bdocker\s+push\b/i
];

const networkShellPatterns = [
  /\bcurl\b.+\|\s*(?:sh|bash|powershell|pwsh)\b/i,
  /\bwget\b.+\|\s*(?:sh|bash|powershell|pwsh)\b/i
];

export function analyzeRun(command: string[], stdout: string, stderr: string): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const joined = command.join(" ");
  const combined = `${stdout}\n${stderr}`;

  if (destructivePatterns.some((pattern) => pattern.test(joined))) {
    findings.push({
      id: "dangerous-command",
      severity: "P0",
      title: "Destructive command pattern",
      detail: "The wrapped command resembles a destructive filesystem or repository operation.",
      evidence: joined,
      suggestion: "Review the trace before sharing or replaying it. Confirm the target path and rollback plan."
    });
  }

  if (publishPatterns.some((pattern) => pattern.test(joined))) {
    findings.push({
      id: "public-publish",
      severity: "P1",
      title: "Public publish or release command",
      detail: "The run appears to publish an artifact or create a public release.",
      evidence: joined,
      suggestion: "Keep release credentials out of trace logs and require a human release checkpoint."
    });
  }

  if (networkShellPatterns.some((pattern) => pattern.test(joined))) {
    findings.push({
      id: "pipe-to-shell",
      severity: "P1",
      title: "Network script piped to shell",
      detail: "The command downloads code and executes it in one step.",
      evidence: joined,
      suggestion: "Download, inspect, pin, and verify scripts before execution."
    });
  }

  if (containsSecretLikeValue(combined)) {
    findings.push({
      id: "secret-like-output",
      severity: "P0",
      title: "Secret-like output was redacted",
      detail: "The command output contained token-like or credential-like text. The saved logs were redacted.",
      suggestion: "Rotate any real credential that may have been printed before the trace was created."
    });
  }

  if (/permission denied|access denied|eperm|eacces/i.test(combined)) {
    findings.push({
      id: "permission-failure",
      severity: "P2",
      title: "Permission failure signal",
      detail: "The run output includes a permission-denied style error.",
      suggestion: "Record the exact command, working directory, and required permission boundary before retrying."
    });
  }

  return findings;
}
