# ghcheck

> **One scan, one report**: CI token blast radius, workflow holes, and leaked secrets.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/momomo12312hgfv/ghcheck)](https://github.com/momomo12312hgfv/ghcheck/releases)

`zizmor` covers workflows, `gitleaks` covers secrets, `patscope` covers tokens — three tools, three reports.
**ghcheck merges them into one repository**: one scan, one report, one gate.

[中文](README.md) · [Rule catalog](docs/rules.md)

---

## Why

The tools that exist each own one slice, and none of them answers all three questions at once:

1. **What can my CI token do?** (what `contents: write` actually means)
2. **What holes does my workflow have?** (script injection, privileged triggers, unpinned actions)
3. **What did I leak?** (GitHub / AWS / private keys / database URLs)

The three analyzers in ghcheck share **one Finding shape, one score, one report**.

## What it checks

| Analyzer | Looks at | Representative rules |
|---|---|---|
| `token` | Effective GITHUB_TOKEN permissions per job, plus PAT scope and permission capabilities | `token.write-all-permissions`, `token.capability.repo.delete` |
| `workflow` | Workflow structure and injection surface | `workflow.script-injection`, `workflow.privileged-checkout`, `workflow.dangerous-trigger` |
| `secret` | Credentials committed to the repository | `secret.github-token`, `secret.aws-access-key-id`, `secret.private-key` |

The full catalog is in [docs/rules.md](docs/rules.md) (78 rules, generated from the code).

## Install

```bash
# Grab the binary for your platform from Releases (self-contained, ~60-85 MB)
bunx ghcheck scan
```

From source (requires [Bun](https://bun.sh) 1.2 or newer):

```bash
git clone https://github.com/momomo12312hgfv/ghcheck.git
cd ghcheck
bun install
bun run src/cli.ts scan
```

## Usage

```bash
# Scan the current directory
ghcheck scan

# Scan a directory and write a Markdown report
ghcheck scan ../my-repo --format markdown > report.md

# SARIF for Code Scanning
ghcheck scan --format sarif > ghcheck.sarif

# CI gate: fail (exit code 2) on high or worse
ghcheck scan --fail-on high

# Run only some analyzers
ghcheck scan --analyzer workflow,secret

# Ignore a rule
ghcheck scan --ignore workflow.unpinned-action

# Skip paths
ghcheck scan --exclude node_modules --exclude dist

# List every rule
ghcheck rules
```

### Token capability analysis

The same repository has a second entry point, `ghcheck token`, which turns a token into a capability map:

```bash
# Read a token for an account from the gh CLI
ghcheck token --gh-account momomo12312hgfv

# Read from stdin, keeps it out of shell history
cat token.txt | ghcheck token --token-stdin

# Fully offline: describe the token yourself
ghcheck token --scopes repo,workflow,delete_repo
ghcheck token --permissions repo.contents=write,repo.workflows=write
```

Classic token scopes come from the GitHub API. **Fine-grained PAT permissions are not exposed by GitHub**, so they can only be self-reported through `--permissions`, and every report says so.

Both entry points can be merged into one scan:

```bash
ghcheck scan ../my-repo --gh-account momomo12312hgfv
```

### Suppressing false positives

One comment syntax works for all three analyzers:

```yaml
- run: echo "${{ github.event.pull_request.title }}"  # ghcheck: ignore workflow.script-injection
- uses: actions/checkout@v4                            # ghcheck: ignore-all
# ghcheck: ignore-file   <- skip the whole file
```

### What is skipped

- The scan **respects the `.gitignore` of the repository root**
- `node_modules`, `dist`, binary files and files above 2 MB are skipped by default
- `--exclude <fragment>` skips paths manually (repeatable)
- `--ignore <rule id>` ignores a rule everywhere (repeatable)

### Output formats

| Format | Use case |
|---|---|
| `terminal` | Human-readable report (default) |
| `markdown` | Paste into an issue or PR |
| `json` | Automation, dashboards, custom checks |
| `sarif` | Code Scanning and other SARIF consumers |

Every SARIF result points at the **real file and line**, so Code Scanning can show the exact spot.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Scan completed and did not cross the `--fail-on` threshold |
| `1` | Invalid input or scan failure |
| `2` | A finding reached the `--fail-on` threshold |

## GitHub Action

```yaml
name: ghcheck
on: [push, pull_request]

permissions:
  contents: read
  security-events: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: momomo12312hgfv/ghcheck@v0.1.0
        with:
          fail-on: high
          format: sarif
          output-file: ghcheck.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: always()
        with:
          sarif_file: ghcheck.sarif
```

The action writes a Markdown report to the job summary, sets the `score`, `level`, `report` and `findings` outputs, and fails the job when the threshold is reached.

## Scoring

The model patscope already proved: the **greater of** the weighted sum and the floor of the highest severity, capped at 100.

| Severity | Weight | Minimum score floor |
| --- | --- | --- |
| critical | 50 | 70 |
| high | 20 | 45 |
| medium | 8 | 20 |
| low | 2 | 0 |

One rule firing in twenty places counts once (highest severity wins), so twenty unpinned actions cannot blow the score up.

## Security and privacy

- **No network access.** The whole scan reads local files only.
- **No writes.** Read-only.
- **No credential printing.** Redaction happens in the core layer and renderers have no bypass; every evidence value looks like `ghp_****...redacted`.
- **No telemetry.** No analytics, no crash reporting, nothing leaves the machine.

## Credits

The rule sets are inspired by these projects (all MIT / Apache-2.0). The full
list is in [THIRD-PARTY.md](THIRD-PARTY.md).

| Project | License | What was borrowed |
|---|---|---|
| [zizmor](https://github.com/zizmorcore/zizmor) | MIT | Workflow security audit ideas and rule taxonomy |
| [actionlint](https://github.com/rhysd/actionlint) | MIT | Workflow correctness checks |
| [secretlint](https://github.com/secretlint/secretlint) | MIT | How secret rules are organized |
| [patscope](https://github.com/momomo12312hgfv/patscope) | MIT | Scoring model, capability matrix, report and Action framework |

## Development

```bash
bun install
bun run typecheck
bun test
bun run build         # binary for the current platform
bun run build:all     # cross-compile six targets
bun run build:action  # bundle the GitHub Action
bun run docs          # regenerate docs/rules.md
```

## Roadmap

- **v0.2** — online audits that need a GitHub token (known-vulnerable actions), configurable rule sets, the token scope-to-capability matrix folded in
- **v0.3** — a published per-rule parity report against zizmor, actionlint and secretlint

## License

MIT. See [LICENSE](LICENSE).
