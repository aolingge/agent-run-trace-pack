const patterns: Array<[RegExp, string]> = [
  [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]"],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_OPENAI_KEY]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_ACCESS_KEY]"],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[REDACTED_GOOGLE_KEY]"],
  [/\b(api[_-]?key|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_.\-+/=]{12,}["']?/gi, "$1=[REDACTED_SECRET]"],
  [/https?:\/\/[^/\s:@]+:[^@\s]+@[^\s]+/gi, "[REDACTED_AUTH_URL]"]
];

export function redactText(value: string): string {
  let output = value;
  for (const [pattern, replacement] of patterns) output = output.replace(pattern, replacement);
  return output;
}

export function containsSecretLikeValue(value: string): boolean {
  return patterns.some(([pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}
