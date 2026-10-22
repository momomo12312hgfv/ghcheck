import { Command } from "commander";
import { ANALYZER_LIST, isAnalyzerId } from "../analyzers";
import type { AnalyzerId } from "../core/types";

interface RulesCliOptions {
  analyzer?: string[];
  format: string;
}

export function registerRules(program: Command): void {
  program
    .command("rules")
    .description("List every rule ghcheck can report")
    .option("--analyzer <ids>", "only list these analyzers: token, workflow, secret (repeatable)")
    .option("--format <format>", "output format: terminal or json", "terminal")
    .action((options: RulesCliOptions) => {
      const selected: AnalyzerId[] = [];
      for (const entry of options.analyzer ?? []) {
        for (const part of entry.split(/[\s,]+/)) {
          const id = part.trim();
          if (!id) continue;
          if (!isAnalyzerId(id)) {
            throw new Error(`Unknown analyzer "${id}". Expected one of: token, workflow, secret.`);
          }
          selected.push(id);
        }
      }

      const analyzers = selected.length > 0
        ? ANALYZER_LIST.filter((analyzer) => selected.includes(analyzer.id))
        : ANALYZER_LIST;

      const rules = analyzers.flatMap((analyzer) =>
        analyzer.rules.map((rule) => ({ ...rule, analyzer: analyzer.id, analyzerName: analyzer.name })),
      );

      if (options.format === "json") {
        process.stdout.write(`${JSON.stringify({ rules }, null, 2)}\n`);
        return;
      }

      const lines: string[] = [];
      for (const analyzer of analyzers) {
        lines.push(`${analyzer.name} (${analyzer.id})`);
        lines.push(`  ${analyzer.description}`);
        lines.push("");
        for (const rule of analyzer.rules) {
          lines.push(`  ${rule.severity.padEnd(9)} ${rule.id}`);
          lines.push(`            ${rule.title}`);
        }
        lines.push("");
      }
      lines.push(`${rules.length} rules across ${analyzers.length} analyzers.`);
      process.stdout.write(`${lines.join("\n")}\n`);
    });
}
