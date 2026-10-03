import puzzle_file from "../data/puzzles.json";

export interface Puzzle {
  id: string;
  difficulty: "medium" | "hard";
  title: string;
  givens: number[];
  solution: number[];
}

interface PuzzleFile {
  puzzles: Puzzle[];
}

function is_puzzle(value: Puzzle): boolean {
  return (
    (value.difficulty === "medium" || value.difficulty === "hard") &&
    Array.isArray(value.givens) &&
    value.givens.length === 81 &&
    Array.isArray(value.solution) &&
    value.solution.length === 81
  );
}

const parsed = (puzzle_file as PuzzleFile).puzzles.map((puzzle) => {
  if (!is_puzzle(puzzle)) throw new Error(`Invalid puzzle record: ${puzzle.id}`);
  return puzzle;
});

export const puzzles: Puzzle[] = parsed;

export const difficulty_label: Record<Puzzle["difficulty"], string> = {
  medium: "Medium",
  hard: "Hard",
};

export const difficulty_order: Puzzle["difficulty"][] = ["medium", "hard"];

export function get_puzzle(puzzle_id: string): Puzzle | null {
  return puzzles.find((puzzle) => puzzle.id === puzzle_id) ?? null;
}

export function puzzles_for(difficulty: Puzzle["difficulty"]): Puzzle[] {
  return puzzles.filter((puzzle) => puzzle.difficulty === difficulty);
}
