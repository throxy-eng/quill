import { empty_notes, first_empty_index, values_from_givens } from "./board";
import { apply_undo, erase_cell, is_solved, place_digit, toggle_candidate, type UndoEntry } from "./game";
import type { Puzzle } from "./puzzles";
import type { PersistedGame } from "./storage";

export const input_mode_label: Record<"normal" | "candidate", string> = {
  normal: "Normal",
  candidate: "Candidate",
};

export const status_label: Record<"new" | "in_progress" | "solved", string> = {
  new: "New",
  in_progress: "In progress",
  solved: "Solved",
};

export interface GameState {
  puzzle_id: string;
  givens: number[];
  solution: number[];
  values: Array<number | null>;
  notes: number[][];
  elapsed_ms: number;
  is_paused: boolean;
  status: "in_progress" | "solved";
  finished_ms: number | null;
  input_mode: "normal" | "candidate";
  auto_candidate: boolean;
  undo_stack: UndoEntry[];
  selected_index: number | null;
  is_ready: boolean;
  has_started: boolean;
  timer_epoch: number;
}

export interface HydrateAction {
  type: "hydrate";
  puzzle: Puzzle;
  saved: PersistedGame | null;
}

export interface SelectAction {
  type: "select";
  index: number;
}

export interface DigitAction {
  type: "digit";
  digit: number;
}

export interface EraseAction {
  type: "erase";
}

export interface UndoAction {
  type: "undo";
}

export interface PauseAction {
  type: "toggle_pause";
}

export interface TickAction {
  type: "tick";
  elapsed_ms: number;
}

export interface ModeAction {
  type: "set_mode";
  input_mode: "normal" | "candidate";
}

export interface AutoAction {
  type: "set_auto";
  auto_candidate: boolean;
}

export interface RestartAction {
  type: "restart";
  puzzle: Puzzle;
}

export type GameAction =
  | HydrateAction
  | SelectAction
  | DigitAction
  | EraseAction
  | UndoAction
  | PauseAction
  | TickAction
  | ModeAction
  | AutoAction
  | RestartAction;

export function fresh_from_puzzle(puzzle: Puzzle, timer_epoch = 0): GameState {
  const values = values_from_givens(puzzle.givens);
  return {
    puzzle_id: puzzle.id,
    givens: puzzle.givens.slice(),
    solution: puzzle.solution.slice(),
    values,
    notes: empty_notes(),
    elapsed_ms: 0,
    is_paused: false,
    status: "in_progress",
    finished_ms: null,
    input_mode: "normal",
    auto_candidate: false,
    undo_stack: [],
    selected_index: first_empty_index(values),
    is_ready: false,
    has_started: false,
    timer_epoch,
  };
}

export function to_persisted(state: GameState): PersistedGame {
  return {
    values: state.values,
    notes: state.notes,
    elapsed_ms: state.elapsed_ms,
    is_paused: state.is_paused,
    status: state.status === "solved" ? "solved" : "in_progress",
    finished_ms: state.finished_ms,
    input_mode: state.input_mode,
    auto_candidate: state.auto_candidate,
    undo_stack: state.undo_stack,
    selected_index: state.selected_index,
  };
}

function board_of(state: GameState) {
  return { values: state.values, notes: state.notes };
}

function with_move(state: GameState, result: { board: { values: Array<number | null>; notes: number[][] }; undo_entry: UndoEntry | null; is_solved: boolean }): GameState {
  if (!result.undo_entry) return state;
  const next: GameState = {
    ...state,
    values: result.board.values,
    notes: result.board.notes,
    undo_stack: [...state.undo_stack, result.undo_entry].slice(-100),
    has_started: true,
  };
  if (result.is_solved) {
    next.status = "solved";
    next.finished_ms = state.elapsed_ms;
    next.is_paused = true;
  }
  return next;
}

function sanitize_notes(saved_notes: number[][] | undefined, values: Array<number | null>): number[][] {
  return values.map((value, index) => {
    if (value !== null) return [];
    const cell = saved_notes?.[index];
    if (!Array.isArray(cell)) return [];
    const cleaned = cell.filter((digit) => Number.isInteger(digit) && digit >= 1 && digit <= 9);
    return [...new Set(cleaned)].sort((left, right) => left - right);
  });
}

function sanitize_undo(stack: UndoEntry[] | undefined): UndoEntry[] {
  if (!Array.isArray(stack)) return [];
  return stack.filter((entry) => {
    return (
      entry &&
      Number.isInteger(entry.index) &&
      entry.index >= 0 &&
      entry.index < 81 &&
      Array.isArray(entry.previous_notes) &&
      Array.isArray(entry.next_notes)
    );
  }).slice(-100);
}

function hydrate_saved(puzzle: Puzzle, saved: PersistedGame, timer_epoch: number): GameState {
  const fresh = fresh_from_puzzle(puzzle, timer_epoch);
  const values = fresh.values.slice();
  for (let index = 0; index < 81; index += 1) {
    if (puzzle.givens[index] !== 0) {
      values[index] = puzzle.givens[index];
      continue;
    }
    const saved_value = saved.values[index];
    values[index] = typeof saved_value === "number" && saved_value >= 1 && saved_value <= 9 ? saved_value : null;
  }
  const notes = sanitize_notes(saved.notes, values);
  const solved = is_solved(values, puzzle.solution);
  const selected = saved.selected_index;
  const selected_index = typeof selected === "number" && selected >= 0 && selected < 81 ? selected : first_empty_index(values);
  return {
    ...fresh,
    values,
    notes,
    elapsed_ms: Number.isFinite(saved.elapsed_ms) ? Math.max(0, saved.elapsed_ms) : 0,
    is_paused: solved ? true : Boolean(saved.is_paused),
    status: solved ? "solved" : "in_progress",
    finished_ms: solved ? (saved.finished_ms ?? saved.elapsed_ms ?? 0) : null,
    input_mode: saved.input_mode === "candidate" ? "candidate" : "normal",
    auto_candidate: Boolean(saved.auto_candidate),
    undo_stack: sanitize_undo(saved.undo_stack),
    selected_index,
    is_ready: true,
    has_started: true,
    timer_epoch,
  };
}

export function reduce_game(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "hydrate":
      if (!action.saved) {
        const fresh = fresh_from_puzzle(action.puzzle, state.timer_epoch + 1);
        return { ...fresh, is_ready: true };
      }
      return hydrate_saved(action.puzzle, action.saved, state.timer_epoch + 1);
    case "select":
      if (state.status === "solved" || state.is_paused) return state;
      if (action.index < 0 || action.index > 80) return state;
      return { ...state, selected_index: action.index };
    case "digit": {
      if (state.status === "solved" || state.is_paused || state.selected_index === null) return state;
      const index = state.selected_index;
      if (state.input_mode === "candidate") {
        if (state.auto_candidate) return state;
        return with_move(state, toggle_candidate(board_of(state), state.givens, index, action.digit, state.solution));
      }
      return with_move(state, place_digit(board_of(state), state.givens, index, action.digit, state.solution));
    }
    case "erase": {
      if (state.status === "solved" || state.is_paused || state.selected_index === null) return state;
      return with_move(
        state,
        erase_cell(board_of(state), state.givens, state.selected_index, state.input_mode, state.solution),
      );
    }
    case "undo": {
      if (state.status === "solved" || state.undo_stack.length === 0) return state;
      const entry = state.undo_stack[state.undo_stack.length - 1];
      const board = apply_undo(board_of(state), entry);
      return {
        ...state,
        values: board.values,
        notes: board.notes,
        undo_stack: state.undo_stack.slice(0, -1),
        has_started: true,
        selected_index: entry.index,
      };
    }
    case "toggle_pause":
      if (state.status === "solved") return state;
      return { ...state, is_paused: !state.is_paused, has_started: true };
    case "tick": {
      if (!state.is_ready || state.is_paused || state.status === "solved") return state;
      if (state.has_started && Math.floor(action.elapsed_ms / 1000) === Math.floor(state.elapsed_ms / 1000)) return state;
      return { ...state, elapsed_ms: action.elapsed_ms, has_started: true };
    }
    case "set_mode":
      if (state.input_mode === action.input_mode) return state;
      return { ...state, input_mode: action.input_mode, has_started: true };
    case "set_auto":
      if (state.auto_candidate === action.auto_candidate) return state;
      return { ...state, auto_candidate: action.auto_candidate, has_started: true };
    case "restart": {
      const fresh = fresh_from_puzzle(action.puzzle, state.timer_epoch + 1);
      return { ...fresh, is_ready: true };
    }
    default:
      return state;
  }
}
