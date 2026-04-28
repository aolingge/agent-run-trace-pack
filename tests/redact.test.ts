import { describe, expect, it } from "vitest";
import { containsSecretLikeValue, redactText } from "../src/core/redact.js";

describe("redaction", () => {
  it("redacts common token-like values", () => {
    const text = [
      "token=ghp_1234567890abcdefghijklmnop",
      "openai=sk-syntheticOpenAIKey1234567890",
      "aws=AKIA1234567890ABCDEF",
      "google=AIzaSyntheticGoogleKey1234567890",
      "password=supersecretvalue123"
    ].join("\n");
    const redacted = redactText(text);

    expect(redacted).not.toContain("ghp_1234567890");
    expect(redacted).not.toContain("sk-syntheticOpenAIKey");
    expect(redacted).not.toContain("AKIA1234567890ABCDEF");
    expect(redacted).not.toContain("AIzaSyntheticGoogleKey");
    expect(redacted).not.toContain("supersecretvalue123");
    expect(redacted).toContain("[REDACTED_GITHUB_TOKEN]");
    expect(redacted).toContain("[REDACTED_OPENAI_KEY]");
    expect(redacted).toContain("[REDACTED_AWS_ACCESS_KEY]");
    expect(redacted).toContain("[REDACTED_GOOGLE_KEY]");
    expect(redacted).toContain("password=[REDACTED_SECRET]");
    expect(containsSecretLikeValue(text)).toBe(true);
  });

  it("redacts authenticated URLs", () => {
    const text = "Fetch https://synthetic-user:synthetic-password@example.invalid/private before retry.";
    const redacted = redactText(text);

    expect(redacted).toContain("[REDACTED_AUTH_URL]");
    expect(redacted).not.toContain("synthetic-password");
  });
});
