/**
 * Tolerant JSON for editor configuration files.
 *
 * VS Code, Cursor and Claude Desktop all write `mcp.json` files that carry
 * comments and trailing commas, and `JSON.parse` rejects both. ghcheck has to
 * read those files anyway: they say what the agent on a developer's machine is
 * allowed to do, so a parse failure would silently drop real findings.
 *
 * The stripping never rewrites string literals, so a `//` inside a URL stays
 * a URL.
 */

export interface JsoncResult {
  value: unknown;
  /** Set when the file could not be parsed at all. */
  error?: string;
}

export function parseJsonc(source: string): JsoncResult {
  try {
    return { value: JSON.parse(stripTrailingCommas(stripComments(source))) };
  } catch (error) {
    return {
      value: undefined,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Removes `//` and block comments, leaving string literals untouched. */
export function stripComments(source: string): string {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;

  while (index < source.length) {
    const char = source[index] ?? "";

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }

    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }

    if (char === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }
      index += 2;
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
}

/** Removes commas that sit directly before a closing brace or bracket. */
export function stripTrailingCommas(source: string): string {
  let output = "";
  let index = 0;
  let inString = false;
  let escaped = false;

  while (index < source.length) {
    const char = source[index] ?? "";

    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      index += 1;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      index += 1;
      continue;
    }

    if (char === ",") {
      let lookahead = index + 1;
      while (lookahead < source.length && /\s/.test(source[lookahead] ?? "")) lookahead += 1;
      const next = source[lookahead];
      if (next === "}" || next === "]") {
        index += 1;
        continue;
      }
    }

    output += char;
    index += 1;
  }

  return output;
}
