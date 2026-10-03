import { legal_digits } from "./board";

export interface UndoEntry {
  index: number;
  previous_value: number | null;
  previous_notes: number[];
  next_value: number | null;
  next_notes: number[];
  previous_removed?: number[];
  next_removed?: number[];
}

export interface BoardState {
  values: Array<number | null>;
  notes: number[][];
  removed: number[][];
}

export interface MoveResult {
  board: BoardState;
  undo_entry: UndoEntry | null;
  is_solved: boolean;
}

function clone_board(board: BoardState): BoardState {
  return {
    values: board.values.slice(),
    notes: board.notes.map((cell_notes) => cell_notes.slice()),
    removed: board.removed.map((cell_removed) => cell_removed.slice()),
  };
}

function notes_equal(left: readonly number[], right: readonly number[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function unchanged(board: BoardState, solution: readonly number[]): MoveResult {
  return { board, undo_entry: null, is_solved: is_solved(board.values, solution) };
}

function commit_cell(
  board: BoardState,
  index: number,
  next_value: number | null,
  next_notes: number[],
  next_removed: number[],
  solution: readonly number[],
): MoveResult {
  const previous_value = board.values[index];
  const previous_notes = board.notes[index];
  const previous_removed = board.removed[index];
  if (
    previous_value === next_value &&
    notes_equal(previous_notes, next_notes) &&
    notes_equal(previous_removed, next_removed)
  ) {
    return unchanged(board, solution);
  }
  const next_board = clone_board(board);
  next_board.values[index] = next_value;
  next_board.notes[index] = next_notes.slice();
  next_board.removed[index] = next_removed.slice();
  return {
    board: next_board,
    undo_entry: {
      index,
      previous_value,
      previous_notes: previous_notes.slice(),
      next_value,
      next_notes: next_notes.slice(),
      previous_removed: previous_removed.slice(),
      next_removed: next_removed.slice(),
    },
    is_solved: is_solved(next_board.values, solution),
  };
}

export function is_solved(values: readonly (number | null)[], solution: readonly number[]): boolean {
  if (values.length !== solution.length) return false;
  for (let index = 0; index < solution.length; index += 1) {
    if (values[index] !== solution[index]) return false;
  }
  return true;
}

export function is_wrong_digit(value: number | null, solution_digit: number, is_given: boolean): boolean {
  if (is_given || value === null) return false;
  return value !== solution_digit;
}

export function place_digit(
  board: BoardState,
  givens: readonly number[],
  index: number,
  digit: number,
  solution: readonly number[],
): MoveResult {
  if (givens[index] !== 0) return unchanged(board, solution);
  return commit_cell(board, index, digit, [], board.removed[index], solution);
}

export function toggle_candidate(
  board: BoardState,
  givens: readonly number[],
  index: number,
  digit: number,
  solution: readonly number[],
): MoveResult {
  if (givens[index] !== 0 || board.values[index] !== null) return unchanged(board, solution);
  const previous_notes = board.notes[index];
  const next_notes = previous_notes.includes(digit)
    ? previous_notes.filter((note) => note !== digit)
    : [...previous_notes, digit].sort((left, right) => left - right);
  return commit_cell(board, index, null, next_notes, board.removed[index], solution);
}

export function toggle_auto_candidate(
  board: BoardState,
  givens: readonly number[],
  index: number,
  digit: number,
  solution: readonly number[],
): MoveResult {
  if (givens[index] !== 0 || board.values[index] !== null) return unchanged(board, solution);
  const legal = new Set(legal_digits(board.values, index));
  const previous_removed = board.removed[index];
  const is_visible = legal.has(digit) && !previous_removed.includes(digit);
  if (is_visible) {
    const next_removed = [...previous_removed, digit].sort((left, right) => left - right);
    return commit_cell(board, index, null, board.notes[index], next_removed, solution);
  }
  if (!legal.has(digit)) return unchanged(board, solution);
  const next_removed = previous_removed.filter((removed_digit) => removed_digit !== digit);
  return commit_cell(board, index, null, board.notes[index], next_removed, solution);
}

export function erase_cell(
  board: BoardState,
  givens: readonly number[],
  index: number,
  input_mode: "normal" | "candidate",
  solution: readonly number[],
): MoveResult {
  if (givens[index] !== 0) return unchanged(board, solution);
  const previous_value = board.values[index];
  const previous_notes = board.notes[index];
  const clear_notes = previous_value === null || input_mode === "candidate";
  const next_notes = clear_notes ? [] : previous_notes.slice();
  return commit_cell(board, index, null, next_notes, board.removed[index], solution);
}

export function apply_undo(board: BoardState, entry: UndoEntry): BoardState {
  const next_board = clone_board(board);
  next_board.values[entry.index] = entry.previous_value;
  next_board.notes[entry.index] = entry.previous_notes.slice();
  if (entry.previous_removed) next_board.removed[entry.index] = entry.previous_removed.slice();
  return next_board;
}
