import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { count_solutions, fill_grid, is_valid_solution, mulberry32, solve_grid } from "../lib/solver";

interface PuzzleSpec {
  id: string;
  difficulty: "medium" | "hard";
  title: string;
  min_givens: number;
  max_givens: number;
  target_givens: number;
  seed: number;
}

interface GeneratedPuzzle {
  id: string;
  difficulty: "medium" | "hard";
  title: string;
  givens: number[];
  solution: number[];
}

const specs: PuzzleSpec[] = [
  { id: "medium-1", difficulty: "medium", title: "Medium 1", min_givens: 30, max_givens: 32, target_givens: 31, seed: 1101 },
  { id: "medium-2", difficulty: "medium", title: "Medium 2", min_givens: 30, max_givens: 32, target_givens: 30, seed: 2202 },
  { id: "medium-3", difficulty: "medium", title: "Medium 3", min_givens: 30, max_givens: 32, target_givens: 32, seed: 3303 },
  { id: "medium-4", difficulty: "medium", title: "Medium 4", min_givens: 30, max_givens: 32, target_givens: 31, seed: 4404 },
  { id: "medium-5", difficulty: "medium", title: "Medium 5", min_givens: 30, max_givens: 32, target_givens: 30, seed: 5505 },
  { id: "hard-1", difficulty: "hard", title: "Hard 1", min_givens: 24, max_givens: 26, target_givens: 25, seed: 6101 },
  { id: "hard-2", difficulty: "hard", title: "Hard 2", min_givens: 24, max_givens: 26, target_givens: 24, seed: 7202 },
  { id: "hard-3", difficulty: "hard", title: "Hard 3", min_givens: 24, max_givens: 26, target_givens: 26, seed: 8303 },
  { id: "hard-4", difficulty: "hard", title: "Hard 4", min_givens: 24, max_givens: 26, target_givens: 25, seed: 9404 },
  { id: "hard-5", difficulty: "hard", title: "Hard 5", min_givens: 24, max_givens: 26, target_givens: 24, seed: 1505 },
];

function shuffle(items: number[], random: () => number): number[] {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap_index = Math.floor(random() * (index + 1));
    const held = next[index];
    next[index] = next[swap_index];
    next[swap_index] = held;
  }
  return next;
}

function dig_puzzle(spec: PuzzleSpec, random: () => number): GeneratedPuzzle | null {
  const solution = fill_grid(random);
  if (!is_valid_solution(solution)) return null;
  const grid = solution.slice();
  const order = shuffle(Array.from({ length: 81 }, (_, index) => index), random);
  let given_count = 81;

  for (const index of order) {
    if (given_count <= spec.target_givens) break;
    const backup = grid[index];
    grid[index] = 0;
    const solutions = count_solutions(grid, 2, 80_000);
    if (solutions !== 1) {
      grid[index] = backup;
      continue;
    }
    given_count -= 1;
  }

  if (given_count < spec.min_givens || given_count > spec.max_givens) return null;
  const solved = solve_grid(grid);
  if (!solved || solved.join() !== solution.join()) return null;
  if (count_solutions(grid, 2) !== 1) return null;

  return {
    id: spec.id,
    difficulty: spec.difficulty,
    title: spec.title,
    givens: grid,
    solution,
  };
}

function generate_spec(spec: PuzzleSpec): GeneratedPuzzle {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const random = mulberry32(spec.seed + attempt * 10007);
    const puzzle = dig_puzzle(spec, random);
    if (puzzle) {
      const given_count = puzzle.givens.filter((digit) => digit !== 0).length;
      console.log(`${puzzle.id} givens=${given_count} attempt=${attempt}`);
      return puzzle;
    }
  }
  throw new Error(`Could not generate ${spec.id}`);
}

const puzzles: GeneratedPuzzle[] = [];
const seen = new Set<string>();

for (const spec of specs) {
  const started = Date.now();
  const puzzle = generate_spec(spec);
  const fingerprint = puzzle.givens.join("");
  if (seen.has(fingerprint)) throw new Error(`Duplicate puzzle ${spec.id}`);
  seen.add(fingerprint);
  puzzles.push(puzzle);
  console.log(`  ${Date.now() - started}ms`);
}

const output_path = resolve(dirname(fileURLToPath(import.meta.url)), "../data/puzzles.json");
writeFileSync(output_path, `${JSON.stringify({ puzzles }, null, 2)}\n`);
console.log(`Wrote ${output_path}`);
