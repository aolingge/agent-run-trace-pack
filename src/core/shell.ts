import { spawnSync } from "node:child_process";

export interface CommandOutput {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function runQuiet(command: string, args: string[], cwd: string): CommandOutput {
  const resolvedCommand = resolveCommand(command);
  const result = spawnSync(resolvedCommand, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

export function resolveCommand(command: string): string {
  if (process.platform !== "win32") return command;
  if (/[\\/]/.test(command) || /\.[a-z0-9]+$/i.test(command)) return command;
  if (/^(npm|npx|pnpm|yarn|gh)$/i.test(command)) return `${command}.cmd`;
  return command;
}
