export function formatDuration(duration: number): string {
  if (duration < 1e3) return `${duration} ms`;
  if (duration < 10e3) return `${(duration / 1e3).toFixed(3)} s`;
  if (duration < 60e3) return `${(duration / 1e3).toFixed(1)} s`;
  return `${(duration / 1e3).toFixed(0)} s`;
}
