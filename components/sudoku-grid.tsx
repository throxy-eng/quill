import { digits, is_same_house } from "@/lib/board";
import { is_wrong_digit } from "@/lib/game";
import { cn } from "@/lib/utils";

interface SudokuGridProps {
  givens: number[];
  values: Array<number | null>;
  notes: number[][];
  solution: number[];
  selected_index: number | null;
  highlight_mistakes: boolean;
  is_paused: boolean;
  is_solved: boolean;
  is_celebrating: boolean;
  on_select: (index: number) => void;
}

function cell_label(index: number, value: number | null, is_given: boolean, cell_notes: number[]): string {
  const row = Math.floor(index / 9) + 1;
  const col = (index % 9) + 1;
  const place = `Row ${row}, column ${col}`;
  if (value !== null) return `${place}, ${is_given ? "given" : "entered"} ${value}`;
  if (cell_notes.length > 0) return `${place}, notes ${cell_notes.join(" ")}`;
  return `${place}, empty`;
}

function WinCelebration() {
  const cells = Array.from({ length: 81 }, (_, index) => index);
  return (
    <div className="pointer-events-none absolute inset-0 z-20" data-testid="win-celebration" role="status" aria-live="polite">
      <div className="absolute inset-0 grid grid-cols-9 grid-rows-9">
        {cells.map((index) => (
          <span
            key={index}
            className="quill-win-cell"
            style={{ animationDelay: `${(index % 9) * 45 + Math.floor(index / 9) * 35}ms` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="quill-win-card rounded-2xl bg-[#f4a03c] px-7 py-4 text-center shadow-[0_12px_40px_rgba(180,90,10,0.35)]">
          <p className="font-display text-[40px] font-medium leading-none text-neutral-950">Solved</p>
        </div>
      </div>
    </div>
  );
}

function GridLines() {
  const marks = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div className="pointer-events-none absolute inset-0">
      {marks.map((step) => {
        const is_thick = step % 3 === 0;
        const position = `${(step / 9) * 100}%`;
        return (
          <span key={step}>
            <span
              className={cn(
                "absolute top-0 z-[1] h-full -translate-x-1/2",
                is_thick ? "w-[2px] bg-neutral-950" : "w-px bg-[#d4d4d4]",
              )}
              style={{ left: position }}
            />
            <span
              className={cn(
                "absolute left-0 z-[1] w-full -translate-y-1/2",
                is_thick ? "h-[2px] bg-neutral-950" : "h-px bg-[#d4d4d4]",
              )}
              style={{ top: position }}
            />
          </span>
        );
      })}
    </div>
  );
}

export function SudokuGrid({
  givens,
  values,
  notes,
  solution,
  selected_index,
  highlight_mistakes,
  is_paused,
  is_solved,
  is_celebrating,
  on_select,
}: SudokuGridProps) {
  const selected_value = selected_index === null ? null : values[selected_index];

  return (
    <div className="relative aspect-square w-full border-2 border-neutral-950" data-testid="sudoku-grid">
      <div role="grid" aria-label="Sudoku" className="grid h-full grid-cols-9 grid-rows-9">
        {values.map((value, index) => {
          const is_given = givens[index] !== 0;
          const is_selected = index === selected_index;
          const is_peer = selected_index !== null && is_same_house(index, selected_index);
          const is_same_digit = selected_value !== null && value === selected_value && !is_selected;
          const is_wrong = highlight_mistakes && is_wrong_digit(value, solution[index], is_given);
          const cell_notes = notes[index] ?? [];
          const fill = is_selected
            ? "bg-[#f4a03c]"
            : is_same_digit
              ? "bg-[#f6c98a]"
              : is_peer
                ? "bg-[#f8f1e4]"
                : is_given
                  ? "bg-[#e8e8e8]"
                  : "bg-white";

          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              data-testid={`cell-${index}`}
              data-value={value ?? ""}
              data-notes={cell_notes.join("")}
              data-given={is_given ? "true" : "false"}
              aria-label={cell_label(index, value, is_given, cell_notes)}
              aria-selected={is_selected}
              disabled={is_paused || is_solved}
              onClick={() => on_select(index)}
              className={cn("relative flex items-center justify-center disabled:opacity-100", fill)}
            >
              {value !== null ? (
                <span
                  className={cn(
                    "text-[22px] font-medium leading-none min-[380px]:text-[26px]",
                    is_given ? "font-semibold text-neutral-950" : "text-neutral-950",
                    is_wrong && "text-[#d40000]",
                  )}
                >
                  {value}
                </span>
              ) : (
                <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[2px]">
                  {digits.map((digit) => (
                    <span
                      key={digit}
                      className="flex items-center justify-center text-[8px] font-medium leading-none text-neutral-700 min-[380px]:text-[10px]"
                    >
                      {cell_notes.includes(digit) ? digit : ""}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <GridLines />
      {is_celebrating ? <WinCelebration /> : null}
      {is_paused && !is_solved ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80" data-testid="paused-overlay">
          <p className="text-[22px] font-medium tracking-wide text-neutral-950">Paused</p>
        </div>
      ) : null}
    </div>
  );
}
