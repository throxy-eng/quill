import type { UndoEntry } from "./game";

export interface PersistedGame {
  values: Array<number | null>;
  notes: number[][];
  removed?: number[][];
  elapsed_ms: number;
  is_paused: boolean;
  status: "in_progress" | "solved";
  finished_ms: number | null;
  input_mode: "normal" | "candidate";
  auto_candidate: boolean;
  undo_stack: UndoEntry[];
  selected_index: number | null;
}

export interface Settings {
  show_timer: boolean;
  highlight_mistakes: boolean;
}

export const default_settings: Settings = {
  show_timer: true,
  highlight_mistakes: true,
};

const game_prefix = "quill.game.v1.";
const settings_key = "quill.settings.v1";

export function game_storage_key(puzzle_id: string): string {
  return `${game_prefix}${puzzle_id}`;
}

function can_store(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function load_game(puzzle_id: string): PersistedGame | null {
  if (!can_store()) return null;
  try {
    const raw = window.localStorage.getItem(game_storage_key(puzzle_id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGame;
    if (!parsed || !Array.isArray(parsed.values) || parsed.values.length !== 81) return null;
    if (!Array.isArray(parsed.notes) || parsed.notes.length !== 81) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function save_game(puzzle_id: string, game: PersistedGame): void {
  if (!can_store()) return;
  try {
    window.localStorage.setItem(game_storage_key(puzzle_id), JSON.stringify(game));
  } catch {
    // Ignore quota and private-mode failures; the in-memory board still plays.
  }
}

export function clear_game(puzzle_id: string): void {
  if (!can_store()) return;
  try {
    window.localStorage.removeItem(game_storage_key(puzzle_id));
  } catch {
    // Ignore storage failures.
  }
}

export function load_settings(): Settings {
  if (!can_store()) return default_settings;
  try {
    const raw = window.localStorage.getItem(settings_key);
    if (!raw) return default_settings;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      show_timer: parsed.show_timer !== false,
      highlight_mistakes: parsed.highlight_mistakes !== false,
    };
  } catch {
    return default_settings;
  }
}

export function save_settings(settings: Settings): void {
  if (!can_store()) return;
  try {
    window.localStorage.setItem(settings_key, JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
}
