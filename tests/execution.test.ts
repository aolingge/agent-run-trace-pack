import { describe, expect, it } from "vitest";
import { describeExecutionError, formatExecutionStatus } from "../src/core/execution.js";

describe("execution failure descriptions", () => {
  it("does not serialize arbitrary native error text, codes or spawn arguments", () => {
    const syntheticValue = "synthetic-private-error-details";
    const error = Object.assign(new Error(syntheticValue), {
      code: syntheticValue,
      spawnargs: [syntheticValue],
      path: syntheticValue
    });
    const description = describeExecutionError(error);
    expect(description?.code).toBe("UNKNOWN");
    expect(JSON.stringify(description)).not.toContain(syntheticValue);
    expect(describeExecutionError(undefined)).toBeUndefined();
  });

  it("explains permission denial without exposing the native error path", () => {
    const description = describeExecutionError(Object.assign(new Error("private fixture path"), { code: "EACCES" }));
    expect(description?.message).toContain("permission");
    expect(JSON.stringify(description)).not.toContain("private fixture path");
  });

  it("keeps real signals distinct from execution and capture errors", () => {
    expect(formatExecutionStatus({ exitCode: null, signal: "SIGTERM" })).toBe("signal SIGTERM");
    expect(formatExecutionStatus({ exitCode: 7, signal: null })).toBe("exit 7");
  });
});
