/**
 * One suppression syntax for all three analyzers.
 *
 *   # ghcheck: ignore rule-id, other-rule   -> suppress those rules on this line
 *   # ghcheck: ignore-all                   -> suppress every finding on this line
 *   # ghcheck: ignore-file                  -> suppress every finding in this file
 *
 * zizmor uses `# zizmor: ignore`, actionlint uses `# actionlint-disable`,
 * secretlint uses `# secretlint-disable-line`. All three collapse into the
 * forms above.
 *
 * The comment marker is accepted in every dialect the scanner meets: `#` for
 * YAML and shell, `//` for TypeScript and Python, `/*` for C style, `--` for
 * SQL and Haskell.
 */

export interface Suppression {
  /** Rule ids suppressed on specific lines. */
  lineRules: Map<number, Set<string>>;
  /** Lines where every rule is suppressed. */
  lineAll: Set<number>;
  /** True when the whole file opted out. */
  fileAll: boolean;
}

const MARKER = "(?:#|//|/\\*|--)";
const RULE_IDS = "([A-Za-z0-9_.\\-]+(?:\\s*,\\s*[A-Za-z0-9_.\\-]+)*)";

const LINE_RULE_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore\\s+${RULE_IDS}`, "g");
const LINE_ALL_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore-all\\b`, "g");
const FILE_ALL_PATTERN = new RegExp(`${MARKER}\\s*ghcheck:\\s*ignore-file\\b`, "g");

export function collectSuppressions(content: string): Suppression {
  const lineRules = new Map<number, Set<string>>();
  const lineAll = new Set<number>();
  let fileAll = false;

  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const lineNumber = index + 1;

    if (FILE_ALL_PATTERN.test(line)) {
      fileAll = true;
      FILE_ALL_PATTERN.lastIndex = 0;
      continue;
    }
    FILE_ALL_PATTERN.lastIndex = 0;

    if (LINE_ALL_PATTERN.test(line)) {
      lineAll.add(lineNumber);
      LINE_ALL_PATTERN.lastIndex = 0;
    } else {
      LINE_ALL_PATTERN.lastIndex = 0;
    }

    LINE_RULE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = LINE_RULE_PATTERN.exec(line)) !== null) {
      const raw = match[1] ?? "";
      const ids = raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const bucket = lineRules.get(lineNumber) ?? new Set<string>();
      for (const id of ids) bucket.add(id);
      lineRules.set(lineNumber, bucket);
    }
  }

  return { lineRules, lineAll, fileAll };
}

export function isSuppressed(suppression: Suppression, ruleId: string, line?: number): boolean {
  if (suppression.fileAll) return true;
  if (line === undefined) return false;
  if (suppression.lineAll.has(line)) return true;
  return suppression.lineRules.get(line)?.has(ruleId) ?? false;
}
