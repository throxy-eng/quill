import { useEffect, useReducer, useRef } from "react";
import { fresh_from_puzzle, reduce_game, to_persisted } from "@/lib/game-state";
import type { Puzzle } from "@/lib/puzzles";
import { clear_game, load_game, save_game } from "@/lib/storage";

export function use_game(puzzle: Puzzle) {
  const [state, dispatch] = useReducer(reduce_game, puzzle, fresh_from_puzzle);
  const state_ref = useRef(state);
  state_ref.current = state;
  const puzzle_ref = useRef(puzzle);
  puzzle_ref.current = puzzle;

  useEffect(() => {
    const current_puzzle = puzzle_ref.current;
    dispatch({ type: "hydrate", puzzle: current_puzzle, saved: load_game(current_puzzle.id) });
  }, [puzzle.id]);

  useEffect(() => {
    const current = state_ref.current;
    if (!current.is_ready || current.puzzle_id !== puzzle.id || current.is_paused || current.status === "solved") return;
    const origin = Date.now() - current.elapsed_ms;
    const timer_id = window.setInterval(() => {
      dispatch({ type: "tick", elapsed_ms: Date.now() - origin });
    }, 250);
    return () => window.clearInterval(timer_id);
  }, [puzzle.id, state.is_ready, state.is_paused, state.status, state.puzzle_id, state.timer_epoch]);

  useEffect(() => {
    function flush() {
      const current = state_ref.current;
      if (!current.is_ready || !current.has_started || current.puzzle_id !== puzzle.id) return;
      save_game(puzzle.id, to_persisted(current));
    }
    flush();
    function on_visibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", on_visibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", on_visibility);
      flush();
    };
  }, [puzzle.id, state]);

  function restart() {
    clear_game(puzzle.id);
    dispatch({ type: "restart", puzzle });
  }

  const is_current = state.is_ready && state.puzzle_id === puzzle.id;

  return {
    is_ready: is_current,
    values: state.values,
    notes: state.notes,
    removed: state.removed,
    elapsed_ms: state.elapsed_ms,
    is_paused: state.is_paused,
    status: state.status,
    finished_ms: state.finished_ms,
    input_mode: state.input_mode,
    auto_candidate: state.auto_candidate,
    can_undo: state.undo_stack.length > 0 && state.status !== "solved",
    selected_index: state.selected_index,
    select_cell: (index: number) => dispatch({ type: "select", index }),
    press_digit: (digit: number) => dispatch({ type: "digit", digit }),
    erase: () => dispatch({ type: "erase" }),
    undo: () => dispatch({ type: "undo" }),
    toggle_pause: () => dispatch({ type: "toggle_pause" }),
    set_input_mode: (input_mode: "normal" | "candidate") => dispatch({ type: "set_mode", input_mode }),
    set_auto_candidate: (auto_candidate: boolean) => dispatch({ type: "set_auto", auto_candidate }),
    restart,
  };
}
