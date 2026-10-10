import type { ExecutionError, TraceManifest } from "../types.js";

// Error.message and spawnargs can contain unredacted command arguments.
// Persist only known codes and fixed descriptions, never the native Error.
export function describeExecutionError(error: NodeJS.ErrnoException | undefined): ExecutionError | undefined {
  if (!error) return undefined;
  switch (error.code) {
    case "ENOENT":
      return { code: "ENOENT", message: "The executable or working directory could not be found." };
    case "EACCES":
    case "EPERM":
      return { code: error.code, message: "The operating system denied permission to run the command." };
    case "ENOBUFS":
      return { code: "ENOBUFS", message: "The command exceeded the 1 MiB output capture limit; captured output may be incomplete." };
    case "EINVAL":
      return { code: "EINVAL", message: "The operating system rejected the process invocation. Windows command scripts may require an explicit command interpreter." };
    default:
      return { code: "UNKNOWN", message: "The process could not be started or captured successfully." };
  }
}

export function formatExecutionStatus(manifest: Pick<TraceManifest, "exitCode" | "signal" | "executionError">): string {
  if (manifest.executionError) return `execution error ${manifest.executionError.code}`;
  if (manifest.exitCode !== null) return `exit ${manifest.exitCode}`;
  return manifest.signal ? `signal ${manifest.signal}` : "signal unknown";
}
