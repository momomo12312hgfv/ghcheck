import { secretAnalyzer } from "./secret";
import { tokenAnalyzer } from "./token";
import { workflowAnalyzer } from "./workflow";
import type { Analyzer, AnalyzerId } from "../core/types";

export const ANALYZER_LIST: Analyzer[] = [tokenAnalyzer, workflowAnalyzer, secretAnalyzer];

export function getAnalyzers(ids?: readonly AnalyzerId[]): Analyzer[] {
  if (!ids || ids.length === 0) return ANALYZER_LIST;
  return ANALYZER_LIST.filter((analyzer) => ids.includes(analyzer.id));
}

export function isAnalyzerId(value: string): value is AnalyzerId {
  return ANALYZER_LIST.some((analyzer) => analyzer.id === value);
}
