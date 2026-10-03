interface TuneNote {
  start_seconds: number;
  frequency: number;
  duration_seconds: number;
  gain: number;
  voice: "bass" | "chord" | "melody";
}

const beat_seconds = 0.64;

function tune_note(beat: number, frequency: number, beats: number, gain: number, voice: TuneNote["voice"]): TuneNote {
  return {
    start_seconds: Number((beat * beat_seconds).toFixed(3)),
    frequency,
    duration_seconds: Number((beats * beat_seconds).toFixed(3)),
    gain,
    voice,
  };
}

// Original fingerstyle phrase in G major, about five seconds, easy tempo.
// Not a quotation of an existing song.
export const win_tune: TuneNote[] = [
  tune_note(0, 98, 1.4, 0.11, "bass"),
  tune_note(0, 196, 0.9, 0.045, "chord"),
  tune_note(0, 246.94, 0.9, 0.04, "chord"),
  tune_note(0, 293.66, 0.55, 0.14, "melody"),
  tune_note(0.5, 392, 0.5, 0.15, "melody"),
  tune_note(1, 493.88, 0.5, 0.15, "melody"),
  tune_note(1.5, 440, 0.55, 0.14, "melody"),
  tune_note(2, 130.81, 1.4, 0.11, "bass"),
  tune_note(2, 261.63, 0.9, 0.04, "chord"),
  tune_note(2, 329.63, 0.9, 0.038, "chord"),
  tune_note(2, 392, 0.5, 0.14, "melody"),
  tune_note(2.5, 329.63, 0.5, 0.14, "melody"),
  tune_note(3, 293.66, 0.5, 0.13, "melody"),
  tune_note(3.5, 246.94, 0.55, 0.12, "melody"),
  tune_note(4, 146.83, 1.4, 0.11, "bass"),
  tune_note(4, 293.66, 0.8, 0.04, "chord"),
  tune_note(4, 369.99, 0.8, 0.035, "chord"),
  tune_note(4, 440, 0.5, 0.15, "melody"),
  tune_note(4.5, 493.88, 0.5, 0.15, "melody"),
  tune_note(5, 587.33, 0.55, 0.14, "melody"),
  tune_note(5.5, 493.88, 0.6, 0.13, "melody"),
  tune_note(6.25, 98, 1.6, 0.12, "bass"),
  tune_note(6.25, 196, 1.5, 0.05, "chord"),
  tune_note(6.25, 246.94, 1.5, 0.045, "chord"),
  tune_note(6.25, 392, 1.7, 0.16, "melody"),
];

export function win_tune_end_seconds(): number {
  let end_seconds = 0;
  for (const note of win_tune) {
    end_seconds = Math.max(end_seconds, note.start_seconds + note.duration_seconds);
  }
  return end_seconds;
}

function audio_context_constructor(): (new () => AudioContext) | null {
  if (typeof window === "undefined") return null;
  const browser = globalThis as typeof globalThis & { webkitAudioContext?: new () => AudioContext };
  return browser.AudioContext ?? browser.webkitAudioContext ?? null;
}

let shared_context: AudioContext | null = null;

function start_pluck(context: AudioContext, when: number, note: TuneNote): void {
  const osc = context.createOscillator();
  const body = context.createBiquadFilter();
  const amp = context.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(note.frequency, when);
  const end = when + note.duration_seconds;
  osc.frequency.exponentialRampToValueAtTime(Math.max(note.frequency * 0.992, 1), end);
  body.type = "lowpass";
  const open_frequency = note.voice === "bass" ? 480 : note.voice === "chord" ? 980 : 2400;
  body.frequency.setValueAtTime(open_frequency, when);
  body.frequency.exponentialRampToValueAtTime(Math.max(open_frequency * 0.45, 180), end);
  body.Q.setValueAtTime(0.6, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(note.gain, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(body);
  body.connect(amp);
  amp.connect(context.destination);
  osc.start(when);
  osc.stop(end + 0.03);

  if (note.voice !== "melody") return;
  const length = Math.floor(context.sampleRate * 0.02);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const pick = context.createBufferSource();
  const pick_filter = context.createBiquadFilter();
  const pick_gain = context.createGain();
  pick.buffer = buffer;
  pick.loop = false;
  pick_filter.type = "highpass";
  pick_filter.frequency.setValueAtTime(1200, when);
  pick_gain.gain.setValueAtTime(0.03, when);
  pick_gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
  pick.connect(pick_filter);
  pick_filter.connect(pick_gain);
  pick_gain.connect(context.destination);
  pick.start(when);
  pick.stop(when + 0.03);
}

export function play_win_tune(): void {
  const Context = audio_context_constructor();
  if (!Context) return;
  if (!shared_context || shared_context.state === "closed") shared_context = new Context();
  const context = shared_context;
  if (context.state === "suspended") void context.resume();
  const start = context.currentTime + 0.02;
  for (const note of win_tune) start_pluck(context, start + note.start_seconds, note);
  if (typeof document !== "undefined") {
    const plays = Number(document.documentElement.dataset.winTunePlays ?? "0");
    document.documentElement.dataset.winTunePlays = String(plays + 1);
  }
}
