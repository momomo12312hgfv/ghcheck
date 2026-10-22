/**
 * A small `.gitignore` matcher.
 *
 * Every scanner in this space honours `.gitignore`, and so does ghcheck: a
 * repository that ignores `dist/` does not want its build output reported.
 *
 * Supported syntax: comments, negation with `!`, directory patterns with a
 * trailing slash, anchoring with a leading slash, `*`, `?` and `**`.
 */

export interface GitignoreRule {
  pattern: RegExp;
  negated: boolean;
  directoryOnly: boolean;
}

function escapeRegex(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function patternToRegex(pattern: string): { regex: RegExp; directoryOnly: boolean } {
  const directoryOnly = pattern.endsWith("/");
  let source = pattern.replace(/\/$/, "");

  const anchored = source.startsWith("/") || source.includes("/");
  source = source.replace(/^\//, "");

  let regex = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "*") {
      if (source[index + 1] === "*") {
        index += 1;
        if (source[index + 1] === "/") {
          index += 1;
          regex += "(?:.*/)?";
        } else {
          regex += ".*";
        }
      } else {
        regex += "[^/]*";
      }
      continue;
    }
    if (char === "?") {
      regex += "[^/]";
      continue;
    }
    regex += escapeRegex(char ?? "");
  }

  const prefix = anchored ? "^" : "(?:^|.*/)";
  return {
    regex: new RegExp(`${prefix}${regex}(?:/.*)?$`),
    directoryOnly,
  };
}

export function parseGitignore(content: string): GitignoreRule[] {
  const rules: GitignoreRule[] = [];

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const negated = line.startsWith("!");
    const pattern = negated ? line.slice(1).trim() : line;
    if (!pattern) continue;

    const { regex, directoryOnly } = patternToRegex(pattern);
    rules.push({ pattern: regex, negated, directoryOnly });
  }

  return rules;
}

/** True when the path is ignored. The last matching rule wins. */
export function isIgnored(rules: readonly GitignoreRule[], relativePath: string): boolean {
  if (rules.length === 0) return false;

  let ignored = false;
  for (const rule of rules) {
    if (rule.pattern.test(relativePath)) {
      ignored = !rule.negated;
    }
  }
  return ignored;
}
