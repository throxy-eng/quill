const full_mask = 0x3fe;

export function count_solutions(source: readonly number[], limit = 2, node_limit = 2_000_000): number {
  const grid = source.slice();
  const rows = Array<number>(9).fill(0);
  const cols = Array<number>(9).fill(0);
  const boxes = Array<number>(9).fill(0);

  for (let index = 0; index < 81; index += 1) {
    const digit = grid[index];
    if (!digit) continue;
    const bit = 1 << digit;
    const row = Math.floor(index / 9);
    const col = index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    if (rows[row] & bit || cols[col] & bit || boxes[box] & bit) return 0;
    rows[row] |= bit;
    cols[col] |= bit;
    boxes[box] |= bit;
  }

  let found = 0;
  let nodes = 0;

  function search(): void {
    if (found >= limit) return;
    nodes += 1;
    if (nodes > node_limit) {
      found = limit;
      return;
    }

    let best_index = -1;
    let best_mask = 0;
    let best_count = 10;

    for (let index = 0; index < 81; index += 1) {
      if (grid[index]) continue;
      const row = Math.floor(index / 9);
      const col = index % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const used = rows[row] | cols[col] | boxes[box];
      const mask = (~used) & full_mask;
      let count = 0;
      let cursor = mask;
      while (cursor) {
        count += 1;
        cursor &= cursor - 1;
      }
      if (count === 0) return;
      if (count < best_count) {
        best_count = count;
        best_index = index;
        best_mask = mask;
        if (count === 1) break;
      }
    }

    if (best_index === -1) {
      found += 1;
      return;
    }

    const row = Math.floor(best_index / 9);
    const col = best_index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << digit;
      if ((best_mask & bit) === 0) continue;
      grid[best_index] = digit;
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
      search();
      rows[row] ^= bit;
      cols[col] ^= bit;
      boxes[box] ^= bit;
      grid[best_index] = 0;
      if (found >= limit) return;
    }
  }

  search();
  return found;
}

export function solve_grid(source: readonly number[]): number[] | null {
  const grid = source.slice();
  if (count_solutions(grid, 1) !== 1) return null;

  const rows = Array<number>(9).fill(0);
  const cols = Array<number>(9).fill(0);
  const boxes = Array<number>(9).fill(0);
  for (let index = 0; index < 81; index += 1) {
    const digit = grid[index];
    if (!digit) continue;
    const bit = 1 << digit;
    const row = Math.floor(index / 9);
    const col = index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    rows[row] |= bit;
    cols[col] |= bit;
    boxes[box] |= bit;
  }

  function search(): boolean {
    let best_index = -1;
    let best_mask = 0;
    let best_count = 10;
    for (let index = 0; index < 81; index += 1) {
      if (grid[index]) continue;
      const row = Math.floor(index / 9);
      const col = index % 9;
      const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const mask = (~(rows[row] | cols[col] | boxes[box])) & full_mask;
      let count = 0;
      let cursor = mask;
      while (cursor) {
        count += 1;
        cursor &= cursor - 1;
      }
      if (count === 0) return false;
      if (count < best_count) {
        best_count = count;
        best_index = index;
        best_mask = mask;
        if (count === 1) break;
      }
    }
    if (best_index === -1) return true;
    const row = Math.floor(best_index / 9);
    const col = best_index % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << digit;
      if ((best_mask & bit) === 0) continue;
      grid[best_index] = digit;
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
      if (search()) return true;
      rows[row] ^= bit;
      cols[col] ^= bit;
      boxes[box] ^= bit;
      grid[best_index] = 0;
    }
    return false;
  }

  return search() ? grid : null;
}

export function is_valid_solution(grid: readonly number[]): boolean {
  if (grid.length !== 81) return false;
  for (let house = 0; house < 9; house += 1) {
    let row_mask = 0;
    let col_mask = 0;
    let box_mask = 0;
    const box_row = Math.floor(house / 3) * 3;
    const box_col = (house % 3) * 3;
    for (let offset = 0; offset < 9; offset += 1) {
      const row_digit = grid[house * 9 + offset];
      const col_digit = grid[offset * 9 + house];
      const box_digit = grid[(box_row + Math.floor(offset / 3)) * 9 + box_col + (offset % 3)];
      if (row_digit < 1 || row_digit > 9 || col_digit < 1 || col_digit > 9 || box_digit < 1 || box_digit > 9) {
        return false;
      }
      row_mask |= 1 << row_digit;
      col_mask |= 1 << col_digit;
      box_mask |= 1 << box_digit;
    }
    if (row_mask !== full_mask || col_mask !== full_mask || box_mask !== full_mask) return false;
  }
  return true;
}

const base_grid = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  4, 5, 6, 7, 8, 9, 1, 2, 3,
  7, 8, 9, 1, 2, 3, 4, 5, 6,
  2, 3, 4, 5, 6, 7, 8, 9, 1,
  5, 6, 7, 8, 9, 1, 2, 3, 4,
  8, 9, 1, 2, 3, 4, 5, 6, 7,
  3, 4, 5, 6, 7, 8, 9, 1, 2,
  6, 7, 8, 9, 1, 2, 3, 4, 5,
  9, 1, 2, 3, 4, 5, 6, 7, 8,
];

function shuffled_copy(items: number[], random: () => number): number[] {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap_index = Math.floor(random() * (index + 1));
    const held = next[index];
    next[index] = next[swap_index];
    next[swap_index] = held;
  }
  return next;
}

export function fill_grid(random: () => number): number[] {
  const digit_map = shuffled_copy([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  const band_order = shuffled_copy([0, 1, 2], random);
  const stack_order = shuffled_copy([0, 1, 2], random);
  const row_order: number[] = [];
  const col_order: number[] = [];

  for (const band of band_order) {
    const rows = shuffled_copy([0, 1, 2], random).map((offset) => band * 3 + offset);
    row_order.push(...rows);
  }
  for (const stack of stack_order) {
    const cols = shuffled_copy([0, 1, 2], random).map((offset) => stack * 3 + offset);
    col_order.push(...cols);
  }

  const grid: number[] = [];
  for (const row of row_order) {
    for (const col of col_order) {
      const raw = base_grid[row * 9 + col];
      grid.push(digit_map[raw - 1]);
    }
  }

  if (random() < 0.5) {
    const transposed = Array<number>(81).fill(0);
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        transposed[col * 9 + row] = grid[row * 9 + col];
      }
    }
    return transposed;
  }

  return grid;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
