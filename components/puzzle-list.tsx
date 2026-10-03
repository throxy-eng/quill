import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { PhoneShell } from "@/components/phone-shell";
import { format_clock } from "@/lib/clock";
import { status_label } from "@/lib/game-state";
import { difficulty_label, difficulty_order, puzzles_for, type Puzzle } from "@/lib/puzzles";
import { load_game } from "@/lib/storage";

interface PuzzleProgress {
  status: "new" | "in_progress" | "solved";
  finished_ms: number | null;
}

function read_progress(): Record<string, PuzzleProgress> {
  const progress: Record<string, PuzzleProgress> = {};
  for (const difficulty of difficulty_order) {
    for (const puzzle of puzzles_for(difficulty)) {
      const saved = load_game(puzzle.id);
      if (!saved) {
        progress[puzzle.id] = { status: "new", finished_ms: null };
        continue;
      }
      progress[puzzle.id] = {
        status: saved.status === "solved" ? "solved" : "in_progress",
        finished_ms: saved.status === "solved" ? saved.finished_ms : null,
      };
    }
  }
  return progress;
}

interface PuzzleRowProps {
  puzzle: Puzzle;
  progress: PuzzleProgress;
}

function PuzzleRow({ puzzle, progress }: PuzzleRowProps) {
  const show_time = progress.status === "solved" && progress.finished_ms !== null;
  return (
    <li>
      <Link
        href={`/play/${puzzle.id}`}
        data-testid={`puzzle-${puzzle.id}`}
        data-status={progress.status}
        className="flex min-h-14 items-center justify-between border-t border-neutral-200 px-5 py-4 active:bg-neutral-50"
      >
        <span className="text-[17px] text-neutral-950">{puzzle.title}</span>
        <span className="flex items-center text-[14px]">
          <span className="text-neutral-500">{status_label[progress.status]}</span>
          {show_time ? (
            <span className="ml-3 tabular-nums text-neutral-950" data-testid={`finish-${puzzle.id}`}>
              {format_clock(progress.finished_ms ?? 0)}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export function PuzzleList() {
  const [progress, set_progress] = useState<Record<string, PuzzleProgress>>({});
  const [is_ready, set_is_ready] = useState(false);

  useEffect(() => {
    function load() {
      set_progress(read_progress());
      set_is_ready(true);
    }
    load();
    function on_show() {
      load();
    }
    window.addEventListener("pageshow", on_show);
    window.addEventListener("focus", on_show);
    return () => {
      window.removeEventListener("pageshow", on_show);
      window.removeEventListener("focus", on_show);
    };
  }, []);

  return (
    <PhoneShell>
      <header className="px-5 pb-2 pt-10">
        <BrandMark />
        <p className="mt-3 text-[14px] text-neutral-500">Five medium and five hard. Original puzzles, saved on this phone.</p>
      </header>
      <main className="pb-10">
        {difficulty_order.map((difficulty) => (
          <section key={difficulty} className="mt-6" aria-label={difficulty_label[difficulty]}>
            <h2 className="px-5 pb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              {difficulty_label[difficulty]}
            </h2>
            <ul>
              {puzzles_for(difficulty).map((puzzle) => (
                <PuzzleRow
                  key={puzzle.id}
                  puzzle={puzzle}
                  progress={is_ready ? progress[puzzle.id] ?? { status: "new", finished_ms: null } : { status: "new", finished_ms: null }}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </PhoneShell>
  );
}
