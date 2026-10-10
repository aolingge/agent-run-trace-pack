// Deliberately synthetic CI failure; never use a real credential in examples.
console.log("synthetic CI: starting verification");
console.log("token", "=", "synthetic-ci-value-not-a-secret");
console.error("synthetic CI: permission denied while opening a fixture");
process.exitCode = 7;
