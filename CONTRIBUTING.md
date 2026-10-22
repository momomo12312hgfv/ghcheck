# Contributing to ghcheck

Thanks for helping out. This project is small on purpose, so a few rules keep it that way.

## Ground rules

1. **One Finding shape.** Every analyzer produces `Finding` objects from `src/core/types.ts` and nothing else. If a renderer, the scorer or the Action needs a new concept, that concept belongs in `Finding`.
2. **Redaction is not optional.** Anything that could contain a credential must go through `src/core/redact.ts` before it leaves an analyzer. The engine applies a second pass as a safety net.
3. **No network calls.** ghcheck reads local files. A rule that needs remote data (for example "is this action version vulnerable") belongs in v0.2, not in a patch.
4. **No writes.** ghcheck never modifies the repository it scans.

## Workflow

```bash
bun install
bun run typecheck
bun test
bun run check       # typecheck + test
```

Before you open a pull request:

- `bun run docs` — regenerates `docs/rules.md` from the code. CI fails if the file is stale.
- `bun run build:action` — rebuilds `action-dist/index.cjs`. CI fails if the committed bundle is stale.

## Adding a rule

1. Add the rule to the analyzer's `rules.ts` with an id of the form `<analyzer>.<name>`.
2. Implement the check in the analyzer and emit a `Finding` with a location, a description and a remediation.
3. Add a test that feeds the analyzer a fixture and asserts the rule id and the line number.
4. Run `bun run docs`.

Rule ids are part of the public interface. Renaming one is a breaking change, because users suppress rules by id.

## Suppression

Everything is suppressed with the same syntax:

```yaml
# ghcheck: ignore workflow.script-injection
# ghcheck: ignore rule-a, rule-b
# ghcheck: ignore-all
# ghcheck: ignore-file
```

## License

By contributing you agree that your work is licensed under the MIT license of this repository.
