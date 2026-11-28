export function safeStringToNumber(str: string | undefined): number | null {
  const num = Number(str);
  return isNaN(num) ? null : num;
}
