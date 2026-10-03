import { auto_candidate_marks } from "../lib/board";
import { fresh_from_puzzle, reduce_game } from "../lib/game-state";
import { puzzles, type Puzzle } from "../lib/puzzles";
import { count_solutions, is_valid_solution } from "../lib/solver";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function given_count(puzzle: Puzzle): number {
  return puzzle.givens.filter((digit) => digit !== 0).length;
}

const seen = new Set<string>();
assert(puzzles.length === 10, "expected 10 puzzles");
assert(puzzles.filter((puzzle) => puzzle.difficulty === "medium").length === 5, "expected 5 medium");
assert(puzzles.filter((puzzle) => puzzle.difficulty === "hard").length === 5, "expected 5 hard");

for (const puzzle of puzzles) {
  const count = given_count(puzzle);
  const range = puzzle.difficulty === "medium" ? [30, 32] : [24, 26];
  assert(count >= range[0] && count <= range[1], `${puzzle.id} has ${count} givens`);
  assert(!seen.has(puzzle.givens.join("")), `${puzzle.id} duplicates another puzzle`);
  seen.add(puzzle.givens.join(""));
  assert(is_valid_solution(puzzle.solution), `${puzzle.id} solution is invalid`);
  for (let index = 0; index < 81; index += 1) {
    const given = puzzle.givens[index];
    assert(given === 0 || given === puzzle.solution[index], `${puzzle.id} given mismatches solution at ${index}`);
  }
  assert(count_solutions(puzzle.givens, 2) === 1, `${puzzle.id} does not have exactly one solution`);
  console.log(`${puzzle.id} ${puzzle.difficulty} givens=${count} unique`);
}

const empty = Array<number>(81).fill(0);
assert(count_solutions(empty, 2) === 2, "empty grid should have more than one solution");
assert(count_solutions(puzzles[0].solution, 2) === 1, "a finished grid should have one solution");

const puzzle = puzzles[0];
let state = reduce_game(fresh_from_puzzle(puzzle), { type: "hydrate", puzzle, saved: null });
const placed_index = state.selected_index;
if (placed_index === null) throw new Error("a new puzzle selects an empty cell");
const correct = puzzle.solution[placed_index];
state = reduce_game(state, { type: "digit", digit: correct });
assert(state.values[placed_index] === correct, "normal mode fills the cell");
assert(state.notes[placed_index].length === 0, "placing a digit clears notes");

const wrong = correct === 9 ? 8 : correct + 1;
state = reduce_game(state, { type: "digit", digit: wrong });
assert(state.values[placed_index] === wrong, "a wrong digit stays in the cell");
state = reduce_game(state, { type: "undo" });
assert(state.values[placed_index] === correct, "undo restores the previous digit");

state = reduce_game(state, { type: "set_mode", input_mode: "candidate" });
const note_index = state.values.findIndex((value) => value === null);
assert(note_index >= 0, "an empty cell remains");
state = reduce_game(state, { type: "select", index: note_index });
state = reduce_game(state, { type: "digit", digit: 4 });
state = reduce_game(state, { type: "digit", digit: 7 });
assert(state.notes[note_index].join(",") === "4,7", "candidate mode toggles notes");
state = reduce_game(state, { type: "digit", digit: 4 });
assert(state.notes[note_index].join(",") === "7", "tapping a note again removes it");

const manual_notes = state.notes.map((cell) => cell.slice());
state = reduce_game(state, { type: "set_auto", auto_candidate: true });
assert(state.notes[note_index].join(",") === manual_notes[note_index].join(","), "auto mode keeps manual notes stored");
state = reduce_game(state, { type: "digit", digit: 2 });
assert(state.notes[note_index].join(",") === "7", "auto mode pauses manual candidate edits");
const computed = auto_candidate_marks(state.values);
assert(computed[note_index].length > 0, "auto mode has legal digits for an empty cell");
assert(state.notes[note_index].join(",") === "7", "stored notes stay separate from computed marks");
for (const digit of computed[note_index]) {
  const row = Math.floor(note_index / 9);
  const col = note_index % 9;
  for (let offset = 0; offset < 9; offset += 1) {
    assert(state.values[row * 9 + offset] !== digit, "auto candidate is not already in the row");
    assert(state.values[offset * 9 + col] !== digit, "auto candidate is not already in the column");
  }
}
state = reduce_game(state, { type: "set_auto", auto_candidate: false });
assert(state.notes[note_index].join(",") === "7", "turning auto off restores manual notes only");

state = reduce_game(state, { type: "set_mode", input_mode: "normal" });
state = reduce_game(state, { type: "select", index: note_index });
state = reduce_game(state, { type: "erase" });
assert(state.values[note_index] === null && state.notes[note_index].length === 0, "erase on an empty cell clears notes");

const given_index = puzzle.givens.findIndex((digit) => digit !== 0);
state = reduce_game(state, { type: "select", index: given_index });
const given_before = state.values[given_index];
state = reduce_game(state, { type: "digit", digit: given_before === 1 ? 2 : 1 });
assert(state.values[given_index] === given_before, "givens are locked");

let solved = state;
for (let index = 0; index < 81; index += 1) {
  if (solved.values[index] !== null) continue;
  solved = reduce_game(solved, { type: "select", index });
  solved = reduce_game(solved, { type: "set_mode", input_mode: "normal" });
  solved = reduce_game(solved, { type: "digit", digit: puzzle.solution[index] });
}
assert(solved.status === "solved", "a filled grid is solved");
assert(solved.finished_ms === solved.elapsed_ms, "finish time matches the timer");
const undo_solved = reduce_game(solved, { type: "undo" });
assert(undo_solved.status === "solved", "a solved puzzle stays locked against undo");

console.log("game rules ok");
