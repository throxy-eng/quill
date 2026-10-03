import { CircleHelp, Ellipsis, Settings } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { PhoneShell } from "@/components/phone-shell";
import { SudokuGrid } from "@/components/sudoku-grid";
import { use_game } from "@/hooks/use-game";
import { use_settings } from "@/hooks/use-settings";
import { digits, visible_auto_candidates } from "@/lib/board";
import { format_clock } from "@/lib/clock";
import { input_mode_label } from "@/lib/game-state";
import { difficulty_label, type Puzzle } from "@/lib/puzzles";
import { cn } from "@/lib/utils";

interface PlayScreenProps {
  puzzle: Puzzle;
}

const panels = {
  help: "help",
  settings: "settings",
  restart: "restart",
} as const;

interface PanelName {
  name: (typeof panels)[keyof typeof panels];
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M13.5 4.75 7 11.25l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="1.4" y="0.8" width="2.7" height="10.4" rx="0.5" fill="currentColor" />
      <rect x="7.9" y="0.8" width="2.7" height="10.4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 1.4v9.2l7.2-4.6L3 1.4Z" fill="currentColor" />
    </svg>
  );
}

interface IconButtonProps {
  label: string;
  test_id: string;
  on_click?: () => void;
  children: ReactNode;
}

function IconButton({ label, test_id, on_click, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={test_id}
      onClick={on_click}
      className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-950 hover:bg-neutral-100"
    >
      {children}
    </button>
  );
}

export function PlayScreen({ puzzle }: PlayScreenProps) {
  const game = use_game(puzzle);
  const { settings, update_settings } = use_settings();
  const [open_panel, set_open_panel] = useState<PanelName["name"] | null>(null);
  const is_locked = !game.is_ready || game.is_paused || game.status === "solved";
  const display_notes = game.auto_candidate ? visible_auto_candidates(game.values, game.removed) : game.notes;

  useEffect(() => {
    function on_key(event: KeyboardEvent) {
      if (!game.is_ready || open_panel) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key >= "1" && event.key <= "9") {
        game.press_digit(Number(event.key));
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "x" || event.key === "X") {
        game.erase();
        return;
      }
      if (event.key === "u" || event.key === "U" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z")) {
        event.preventDefault();
        game.undo();
        return;
      }
      if (!event.key.startsWith("Arrow") || game.is_paused || game.status === "solved") return;
      event.preventDefault();
      const current = game.selected_index ?? 0;
      const row = Math.floor(current / 9);
      const col = current % 9;
      const next_row = event.key === "ArrowUp" ? (row + 8) % 9 : event.key === "ArrowDown" ? (row + 1) % 9 : row;
      const next_col = event.key === "ArrowLeft" ? (col + 8) % 9 : event.key === "ArrowRight" ? (col + 1) % 9 : col;
      game.select_cell(next_row * 9 + next_col);
    }
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, [game, open_panel]);

  const time_label = format_clock(game.status === "solved" ? (game.finished_ms ?? game.elapsed_ms) : game.elapsed_ms);

  return (
    <PhoneShell>
      <Head>
        <title>{`${puzzle.title} · Quill`}</title>
      </Head>
      <header className="flex h-14 items-center justify-between pl-1 pr-1 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center">
          <Link href="/" aria-label="Back" data-testid="back" className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-950 hover:bg-neutral-100">
            <BackIcon />
          </Link>
          <span className="text-[17px] font-semibold tracking-tight text-neutral-950">{difficulty_label[puzzle.difficulty]}</span>
        </div>
        <div className="flex items-center">
          {settings.show_timer ? (
            game.status === "solved" ? (
              <span
                data-testid="timer"
                className="mr-1 flex h-8 items-center rounded-full bg-[#d7ebf8] px-3 text-[15px] font-medium tabular-nums text-[#1d6fe3]"
              >
                {time_label}
              </span>
            ) : (
              <button
                type="button"
                data-testid="timer"
                aria-label={game.is_paused ? "Resume timer" : "Pause timer"}
                aria-pressed={game.is_paused}
                onClick={game.toggle_pause}
                className="mr-1 flex h-8 items-center gap-2 rounded-full bg-[#d7ebf8] pl-3 pr-2.5 text-[15px] font-medium tabular-nums text-[#1d6fe3]"
              >
                <span data-testid="time-value">{time_label}</span>
                {game.is_paused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )
          ) : null}
          <IconButton label="Help" test_id="help" on_click={() => set_open_panel(panels.help)}>
            <CircleHelp className="h-5 w-5" strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Settings" test_id="settings" on_click={() => set_open_panel(panels.settings)}>
            <Settings className="h-5 w-5" strokeWidth={1.75} />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More"
                data-testid="more"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-950 hover:bg-neutral-100"
              >
                <Ellipsis className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem data-testid="restart" onSelect={() => set_open_panel(panels.restart)}>
                Restart puzzle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {game.status === "solved" ? (
        <p className="px-4 pb-2 text-center text-[15px] font-medium text-neutral-950" data-testid="solved-banner">
          Solved in {time_label}
        </p>
      ) : null}

      <main className="flex flex-1 flex-col px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {game.is_ready ? (
          <SudokuGrid
            givens={puzzle.givens}
            values={game.values}
            notes={display_notes}
            solution={puzzle.solution}
            selected_index={game.selected_index}
            highlight_mistakes={settings.highlight_mistakes}
            is_paused={game.is_paused}
            is_solved={game.status === "solved"}
            is_celebrating={game.is_celebrating}
            on_select={game.select_cell}
          />
        ) : (
          <div className="aspect-square w-full border-2 border-neutral-200" />
        )}

        <div className="mt-4 flex justify-center" role="group" aria-label="Entry mode">
          <div className="inline-flex rounded-full bg-[#f2f2f2] p-1">
            {(["normal", "candidate"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-testid={`mode-${mode}`}
                aria-pressed={game.input_mode === mode}
                onClick={() => game.set_input_mode(mode)}
                className={cn(
                  "rounded-full px-5 py-1.5 text-[15px]",
                  game.input_mode === mode ? "bg-neutral-950 text-white" : "text-neutral-950",
                )}
              >
                {input_mode_label[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 px-1">
          <button
            type="button"
            data-testid="undo"
            onClick={game.undo}
            disabled={!game.can_undo}
            className="px-1 py-1 text-left text-[17px] text-neutral-500 disabled:opacity-30"
          >
            Undo
          </button>
          <div className="grid grid-cols-5" data-testid="number-pad">
            {digits.map((digit) => (
              <button
                key={digit}
                type="button"
                data-testid={`digit-${digit}`}
                disabled={is_locked}
                onClick={() => game.press_digit(digit)}
                className="flex h-[52px] items-center justify-center rounded-lg text-[32px] leading-none text-neutral-950 active:bg-neutral-100 disabled:opacity-30"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              data-testid="erase"
              aria-label="Erase"
              disabled={is_locked}
              onClick={game.erase}
              className="flex h-[52px] items-center justify-center rounded-lg text-[32px] font-light leading-none text-neutral-950 active:bg-neutral-100 disabled:opacity-30"
            >
              X
            </button>
          </div>
          <label className="mt-2 flex items-center gap-3 px-1 py-2 text-[16px] text-neutral-950">
            <Checkbox
              id="auto-candidate"
              data-testid="auto-candidate"
              checked={game.auto_candidate}
              onCheckedChange={(value) => game.set_auto_candidate(value === true)}
              className="h-[18px] w-[18px] rounded-[2px] border-2 border-neutral-950 shadow-none data-[state=checked]:bg-neutral-950 data-[state=checked]:text-white"
            />
            Auto Candidate Mode
          </label>
        </div>
      </main>

      <Dialog open={open_panel !== null} onOpenChange={(open) => { if (!open) set_open_panel(null); }}>
        <DialogContent>
          {open_panel === panels.help ? (
            <>
              <DialogHeader>
                <DialogTitle>How to play</DialogTitle>
                <DialogDescription>Fill every cell so the grid matches the solution.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-[15px] leading-relaxed text-neutral-800">
                <p><span className="font-semibold">Normal</span> writes the digit you tap into the selected cell.</p>
                <p><span className="font-semibold">Candidate</span> toggles that digit as a note in the selected cell.</p>
                <p>
                  <span className="font-semibold">Auto Candidate Mode</span> starts on. Empty cells show every digit still legal in the row, column, and box, refreshed after each change. In Candidate mode, tap a shown digit to remove it. It stays off until you tap it again, and it returns only if it is still legal. Turn Auto Candidate off and only the notes you entered yourself remain.
                </p>
              </div>
            </>
          ) : null}
          {open_panel === panels.settings ? (
            <>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="show-timer" className="text-[16px]">Show timer</label>
                  <Switch
                    id="show-timer"
                    data-testid="show-timer"
                    checked={settings.show_timer}
                    onCheckedChange={(value) => update_settings({ show_timer: value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label htmlFor="highlight-mistakes" className="text-[16px]">Highlight mistakes</label>
                    <p className="mt-1 text-[13px] leading-snug text-neutral-500">A wrong digit stays in the cell and turns red.</p>
                  </div>
                  <Switch
                    id="highlight-mistakes"
                    data-testid="highlight-mistakes"
                    checked={settings.highlight_mistakes}
                    onCheckedChange={(value) => update_settings({ highlight_mistakes: value })}
                  />
                </div>
              </div>
            </>
          ) : null}
          {open_panel === panels.restart ? (
            <>
              <DialogHeader>
                <DialogTitle>Restart puzzle</DialogTitle>
                <DialogDescription>Clears your entries, notes, and timer for this puzzle.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => set_open_panel(null)}>Cancel</Button>
                <Button
                  data-testid="confirm-restart"
                  onClick={() => {
                    game.restart();
                    set_open_panel(null);
                  }}
                >
                  Restart
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PhoneShell>
  );
}
