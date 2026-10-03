export const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function row_of(index: number): number {
  return Math.floor(index / 9);
}

export function col_of(index: number): number {
  return index % 9;
}

export function box_of(index: number): number {
  return Math.floor(row_of(index) / 3) * 3 + Math.floor(col_of(index) / 3);
}

export function is_same_house(left: number, right: number): boolean {
  if (left === right) return false;
  if (row_of(left) === row_of(right) || col_of(left) === col_of(right)) return true;
  return box_of(left) === box_of(right);
}

export function legal_digits(values: readonly (number | null)[], index: number): number[] {
  const used = new Set<number>();
  const row = row_of(index);
  const col = col_of(index);
  const box_row = Math.floor(row / 3) * 3;
  const box_col = Math.floor(col / 3) * 3;

  for (let offset = 0; offset < 9; offset += 1) {
    const row_value = values[row * 9 + offset];
    const col_value = values[offset * 9 + col];
    const box_value = values[(box_row + Math.floor(offset / 3)) * 9 + box_col + (offset % 3)];
    if (row_value !== null) used.add(row_value);
    if (col_value !== null) used.add(col_value);
    if (box_value !== null) used.add(box_value);
  }

  return digits.filter((digit) => !used.has(digit));
}

export function auto_candidate_marks(values: readonly (number | null)[]): number[][] {
  return values.map((value, index) => (value === null ? legal_digits(values, index) : []));
}

export function visible_auto_candidates(
  values: readonly (number | null)[],
  removed: readonly (readonly number[])[],
): number[][] {
  return values.map((value, index) => {
    if (value !== null) return [];
    const blocked = new Set(removed[index] ?? []);
    return legal_digits(values, index).filter((digit) => !blocked.has(digit));
  });
}

export function first_empty_index(values: readonly (number | null)[]): number | null {
  const index = values.findIndex((value) => value === null);
  return index === -1 ? null : index;
}

export function values_from_givens(givens: readonly number[]): Array<number | null> {
  return givens.map((digit) => (digit === 0 ? null : digit));
}

export function empty_notes(): number[][] {
  return Array.from({ length: 81 }, () => []);
}
