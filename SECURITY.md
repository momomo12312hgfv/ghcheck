# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub's advisory form for this repository:
<https://github.com/momomo12312hgfv/ghcheck/security/advisories/new>

Do not open a public issue for a vulnerability.

## What ghcheck does with your code

ghcheck is a local, read-only scanner.

- It **reads** files under the path you give it and writes nothing back.
- It makes **no network requests**. There is no telemetry, no analytics and no crash reporting.
- It **never prints a credential**. Redaction happens in the core layer (`src/core/redact.ts`) and the engine applies a second pass, so a rule that forgets to redact still cannot leak a value into a report.
- It does not read `GH_TOKEN`, `GITHUB_TOKEN` or any other environment variable in v0.1. Online audits that need a token are planned for v0.2 and will be opt-in.

## Threat model of a scan

A scan reads untrusted content: a repository may contain a file crafted to make ghcheck misbehave. The relevant protections are:

| Risk | Mitigation |
| --- | --- |
| A file leaks a credential through a report | Redaction in the core layer plus a second pass in the engine |
| A huge file exhausts memory | Files above 2 MB are skipped and counted in `stats.skippedFiles` |
| A binary file corrupts the output | Files containing a NUL byte are skipped |
| A symlink escapes the scan root | Symlinks are never followed |
| A path is traversed out of the root | The walker only descends into directories it listed itself |
| Unbounded repository probing | ghcheck makes no network requests at all |
