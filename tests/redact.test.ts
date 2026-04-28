import { describe, expect, it } from "vitest";
import { containsSecretLikeValue, redactText } from "../src/core/redact.js";

describe("redaction", () => {
  it("redacts common token-like values", () => {
    const text = "token=ghp_1234567890abcdefghijklmnop and password=supersecretvalue123";
    const redacted = redactText(text);
    expect(redacted).not.toContain("ghp_1234567890");
    expect(redacted).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(containsSecretLikeValue(text)).toBe(true);
  });
});
