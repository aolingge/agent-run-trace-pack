# Synthetic Trace Fixtures

The JSON files in `synthetic-traces/` are artificial examples for tests and documentation. They are safe to load from disk in deterministic order and must not require network access, telemetry, hosted calls, model-provider calls, credentials, or real agent runs.

Fixture content must not contain secrets, cookies, private logs, browser profiles, private URLs, customer code, or real credentials. Secret-like strings in this directory are synthetic redaction samples only.

Tests should treat fixture commands as input data, not commands to execute.
