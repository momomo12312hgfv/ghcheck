# Parity report

How ghcheck compares with [zizmor](https://github.com/zizmorcore/zizmor), [actionlint](https://github.com/rhysd/actionlint) and [secretlint](https://github.com/secretlint/secretlint) on a corpus of real GitHub Actions workflows.

Regenerate with `bun run scripts/fetch-corpus.ts` followed by `bun run scripts/parity.ts`.

## Corpus

| | |
| --- | --- |
| Workflow files | 200 |
| Repositories | 12 |
| Source | public repositories with more than 5,000 stars |

## Results

| Tool | Version | Findings |
| --- | --- | --- |
| ghcheck | 0.1.0 | 281 |
| zizmor | 1.31.1 | 664 |
| actionlint | 1.7.12 | 139 |
| secretlint | 13.0.7 | 0 (199 files scanned) |

## Rule coverage

| ghcheck rule | zizmor | actionlint | secretlint | note |
| --- | --- | --- | --- | --- |
| `workflow.script-injection` | `template-injection` | — | — | zizmor resolves the expression and checks the sink; ghcheck matches the source and the sink separately |
| `workflow.indirect-interpolation` | `template-injection` | — | — | the same audit, split by how much is known about the source of the value |
| `workflow.privileged-checkout` | `artipacked` | — | — | zizmor also reports credential persistence, ghcheck only reports the privileged checkout |
| `workflow.dangerous-trigger` | `dangerous-triggers` | — | — |  |
| `workflow.unpinned-action` | `unpinned-uses` | — | — |  |
| `workflow.deprecated-action` | `known-vulnerable-actions` | — | — | zizmor checks this online against the advisory database, ghcheck uses a local table |
| `workflow.secrets-inherit` | `secrets-inherit` | — | — |  |
| `workflow.self-hosted-runner` | `self-hosted-runner` | — | — |  |
| `workflow.docker-unpinned` | `unpinned-images` | — | — |  |
| `workflow.invalid-yaml` | — | `syntax-check` | — | actionlint is the tool that reports workflow syntax errors |
| `token.write-all-permissions` | `excessive-permissions` | — | — |  |
| `token.write-permission-*` | `excessive-permissions` | — | — | ghcheck names the permission, zizmor reports the workflow |
| `token.permissions-not-declared` | `excessive-permissions` | — | — |  |
| `secret.*` | — | — | `all provider rules` | ghcheck has its own provider rules, the overlap is partial |

## ghcheck findings per rule

| Rule | Findings |
| --- | --- |
| `workflow.indirect-interpolation` | 81 |
| `workflow.unpinned-action` | 57 |
| `token.permissions-not-declared` | 27 |
| `workflow.dangerous-trigger` | 25 |
| `token.write-permission-actions` | 23 |
| `token.write-permission-contents` | 19 |
| `token.write-permission-issues` | 19 |
| `token.write-permission-packages` | 6 |
| `workflow.self-hosted-runner` | 6 |
| `token.write-permission-attestations` | 5 |
| `workflow.deprecated-action` | 4 |
| `token.write-permission-deployments` | 2 |
| `token.write-permission-pages` | 2 |
| `secret.basic-auth-url` | 2 |
| `secret.high-entropy-value` | 2 |
| `workflow.secrets-inherit` | 1 |

## zizmor findings per audit

| Audit | Findings |
| --- | --- |
| `self-repository` | 264 |
| `artipacked` | 127 |
| `template-injection` | 89 |
| `unpinned-uses` | 57 |
| `excessive-permissions` | 41 |
| `obfuscation` | 39 |
| `adhoc-packages` | 19 |
| `cache-poisoning` | 11 |
| `dangerous-triggers` | 10 |
| `superfluous-actions` | 2 |
| `unsound-ternary` | 2 |
| `unsound-condition` | 1 |
| `secrets-inherit` | 1 |
| `github-env` | 1 |

## actionlint findings per check

| Check | Findings |
| --- | --- |
| `runner-label` | 64 |
| `workflow-call` | 25 |
| `syntax-check` | 22 |
| `expression` | 18 |
| `action` | 8 |
| `if-cond` | 2 |

## secretlint findings per rule

| Rule | Findings |
| --- | --- |

## What ghcheck does not cover

These zizmor audits had findings on this corpus and ghcheck has no rule for them. They are the honest gap list.

| zizmor audit | Findings |
| --- | --- |
| `self-repository` | 264 |
| `obfuscation` | 39 |
| `adhoc-packages` | 19 |
| `cache-poisoning` | 11 |
| `superfluous-actions` | 2 |
| `unsound-ternary` | 2 |
| `unsound-condition` | 1 |
| `github-env` | 1 |

## What ghcheck covers that the others do not

- `ghcheck token` turns a personal access token into a capability map, which none of the three tools do.
- `ghcheck scan` reports the GITHUB_TOKEN permissions of every job by name, zizmor reports the workflow that has too much permission.
- One suppression syntax for all rules, one report, one score.

