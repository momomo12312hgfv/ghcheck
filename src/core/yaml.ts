import { parseDocument, isMap, isScalar, isSeq, type Document, type Node, type Pair } from "yaml";

/**
 * Thin helpers over the `yaml` node API.
 *
 * The node API is used instead of plain `parse()` because ghcheck has to
 * point at the exact line of every finding, and plain objects throw that
 * information away.
 */

export interface YamlEntry {
  key: string;
  keyNode: Node | null;
  value: Node | null;
}

export function parseYamlDocument(source: string): Document {
  return parseDocument(source, { keepSourceTokens: false });
}

export function mapEntries(node: Node | null | undefined): YamlEntry[] {
  if (!node || !isMap(node)) return [];
  return (node.items as Pair[]).map((pair) => ({
    key: pair.key ? String((pair.key as { value?: unknown }).value ?? "") : "",
    keyNode: (pair.key as Node | null) ?? null,
    value: (pair.value as Node | null) ?? null,
  }));
}

export function seqItems(node: Node | null | undefined): Node[] {
  if (!node || !isSeq(node)) return [];
  return node.items as Node[];
}

export function scalarText(node: Node | null | undefined): string | null {
  if (!node || !isScalar(node)) return null;
  const value = (node as { value?: unknown }).value;
  if (value === null || value === undefined) return null;
  return String(value);
}

export function nodeOffset(node: Node | null | undefined): number | null {
  if (!node) return null;
  const range = (node as { range?: [number, number, number] }).range;
  return range ? range[0] : null;
}

export function nodeEnd(node: Node | null | undefined): number | null {
  if (!node) return null;
  const range = (node as { range?: [number, number, number] }).range;
  return range ? range[1] : null;
}

/**
 * Finds a needle inside the raw source span of a node.
 *
 * Working on the raw span (rather than the parsed value) is what makes block
 * scalars line up with the file: the node range of a `run: |` block starts at
 * the pipe character, not at the first character of the script.
 */
export function offsetInNode(source: string, node: Node | null | undefined, needle: string): number | null {
  const start = nodeOffset(node);
  const end = nodeEnd(node);
  if (start === null || end === null) return null;

  const index = source.slice(start, end).indexOf(needle);
  return index === -1 ? null : start + index;
}

export function lineOfOffset(source: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) line += 1;
  }
  return line;
}
