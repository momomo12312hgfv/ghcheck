import { describe, expect, test } from "bun:test";
import { evaluateFindings, scoreLevel, SEVERITY_FLOORS, SEVERITY_WEIGHTS } from "../src/core/score";
import type { Finding, Severity } from "../src/core/types";

function finding(id: string, severity: Severity, analyzer: Finding["analyzer"] = "workflow"): Finding {
  return {
    id,
    analyzer,
    severity,
    title: id,
    description: id,
    remediation: "fix it",
  };
}

describe("score model", () => {
  test("uses the same weights and floors as patscope", () => {
    expect(SEVERITY_WEIGHTS).toEqual({ critical: 50, high: 20, medium: 8, low: 2 });
    expect(SEVERITY_FLOORS).toEqual({ critical: 70, high: 45, medium: 20, low: 0 });
  });

  test("maps scores to levels", () => {
    expect(scoreLevel(0)).toBe("low");
    expect(scoreLevel(19)).toBe("low");
    expect(scoreLevel(20)).toBe("medium");
    expect(scoreLevel(44)).toBe("medium");
    expect(scoreLevel(45)).toBe("high");
    expect(scoreLevel(69)).toBe("high");
    expect(scoreLevel(70)).toBe("critical");
  });

  test("sums the weights of distinct rules", () => {
    const result = evaluateFindings([finding("a", "medium"), finding("b", "medium")]);
    expect(result.rawValue).toBe(16);
    expect(result.value).toBe(20);
    expect(result.floorApplied).toBe(true);
  });

  test("counts one rule that fires many times only once", () => {
    const result = evaluateFindings([
      finding("a", "medium"),
      finding("a", "medium"),
      finding("a", "medium"),
    ]);
    expect(result.rawValue).toBe(8);
    expect(result.breakdown[0]?.count).toBe(3);
  });

  test("keeps the highest severity when one rule fires with different severities", () => {
    const result = evaluateFindings([finding("a", "low"), finding("a", "critical")]);
    expect(result.rawValue).toBe(50);
    expect(result.breakdown[0]?.severity).toBe("critical");
  });

  test("applies the floor of the highest severity so one critical rule cannot look harmless", () => {
    const result = evaluateFindings([finding("a", "critical")]);
    expect(result.rawValue).toBe(50);
    expect(result.value).toBe(70);
    expect(result.floorApplied).toBe(true);
    expect(result.level).toBe("critical");
  });

  test("caps the score at 100", () => {
    const result = evaluateFindings([
      finding("a", "critical"),
      finding("b", "critical"),
      finding("c", "critical"),
    ]);
    expect(result.value).toBe(100);
  });

  test("an empty report scores zero", () => {
    const result = evaluateFindings([]);
    expect(result.value).toBe(0);
    expect(result.level).toBe("low");
    expect(result.highestSeverity).toBeNull();
  });
});
