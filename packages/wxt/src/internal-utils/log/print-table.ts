export function printTable(
  log: (message: string) => void,
  header: string,
  rows: string[][],
  gap = 2,
): void {
  if (rows.length === 0) return;

  const columnWidths = rows.reduce(
    (widths, row) => {
      for (let i = 0; i < Math.max(widths.length, row.length); i++) {
        widths[i] = Math.max(row[i]?.length ?? 0, widths[i] ?? 0);
      }
      return widths;
    },
    rows[0].map((column) => column.length),
  );

  let str = '';
  rows.forEach((row, i) => {
    row.forEach((col, j) => {
      str += col.padEnd(columnWidths[j], ' ');
      if (j !== row.length - 1) str += ''.padEnd(gap, ' ');
    });
    if (i !== rows.length - 1) str += '\n';
  });

  log(`${header}\n${str}`);
}
