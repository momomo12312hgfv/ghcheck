/** Maps a character offset to a 1-based line number without rescanning the file. */
export function buildLineOffsets(content: string): number[] {
  const offsets = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content.charCodeAt(index) === 10) offsets.push(index + 1);
  }
  return offsets;
}

export function lineAt(offsets: readonly number[], index: number): number {
  let low = 0;
  let high = offsets.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const offset = offsets[mid] ?? 0;
    if (offset <= index) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result + 1;
}

export function lineText(content: string, line: number): string {
  const lines = content.split(/\r?\n/);
  return lines[line - 1] ?? "";
}
