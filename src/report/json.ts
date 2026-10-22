import type { Report } from "../core/types";

export function renderJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
