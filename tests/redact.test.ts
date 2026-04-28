import { describe, expect, it } from "vitest";
import { containsSecretLikeValue, redactText } from "../src/core/redact.js";

describe("redaction", () => {
  it("redacts common token-like values", () => {
    const githubToken = ["ghp", "1234567890abcdefghijklmnop"].join("_");
    const openAiKey = ["sk", "syntheticOpenAIKey1234567890"].join("-");
    const awsKey = ["AKIA", "1234567890ABCDEF"].join("");
    const googleKey = ["AIza", "SyntheticGoogleKey1234567890"].join("");
    const password = ["super", "secret", "value", "123"].join("");
    const text = [
      `token=${githubToken}`,
      `openai=${openAiKey}`,
      `aws=${awsKey}`,
      `google=${googleKey}`,
      `password=${password}`
    ].join("\n");
    const redacted = redactText(text);

    expect(redacted).not.toContain(githubToken);
    expect(redacted).not.toContain(openAiKey);
    expect(redacted).not.toContain(awsKey);
    expect(redacted).not.toContain(googleKey);
    expect(redacted).not.toContain(password);
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
