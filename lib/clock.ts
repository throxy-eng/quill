export function format_clock(elapsed_ms: number): string {
  const safe_seconds = Math.max(0, Math.floor(elapsed_ms / 1000));
  const hours = Math.floor(safe_seconds / 3600);
  const minutes = Math.floor((safe_seconds % 3600) / 60);
  const seconds = safe_seconds % 60;
  const second_text = seconds.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${second_text}`;
  }
  return `${minutes}:${second_text}`;
}
