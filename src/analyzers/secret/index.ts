import { buildLineOffsets, lineAt, lineText } from "../../core/lines";
import { redactMatch, redactSecrets } from "../../core/redact";
import type { Analyzer, AnalyzerContext, Finding, RuleDefinition } from "../../core/types";
import { SECRET_RULES, type SecretRule } from "./rules";

function toRuleDefinition(rule: SecretRule): RuleDefinition {
  return {
    id: rule.id,
    title: rule.title,
    severity: rule.severity,
    description: rule.description,
    remediation: rule.remediation,
  };
}

interface ClaimedRange {
  start: number;
  end: number;
}

function overlaps(claims: readonly ClaimedRange[], start: number, end: number): boolean {
  return claims.some((claim) => start < claim.end && end > claim.start);
}

export function analyzeSecretContent(context: AnalyzerContext): Finding[] {
  const { content, file } = context;
  const offsets = buildLineOffsets(content);
  const findings: Finding[] = [];
  const claims: ClaimedRange[] = [];

  for (const rule of SECRET_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      const matched = match[0];
      const credential = match[1] ?? matched;

      if (match[0].length === 0) {
        pattern.lastIndex += 1;
        continue;
      }

      const start = match.index;
      const end = start + match[0].length;
      const line = lineAt(offsets, start);

      if (overlaps(claims, start, end)) continue;

      const lineSource = lineText(content, line);
      if (rule.isFalsePositive?.(credential, lineSource)) continue;

      claims.push({ start, end });

      findings.push({
        id: rule.id,
        analyzer: "secret",
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        location: { file, line },
        evidence: redactSecrets(redactMatch(credential)),
        remediation: rule.remediation,
      });
    }
  }

  return findings;
}

export const secretAnalyzer: Analyzer = {
  id: "secret",
  name: "Secret scanner",
  description:
    "Finds committed credentials: GitHub, AWS, private keys, Slack, Stripe, LLM API keys, database URLs and high-entropy values.",
  rules: SECRET_RULES.map(toRuleDefinition),
  analyze: analyzeSecretContent,
};
