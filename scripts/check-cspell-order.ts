const configPath = 'cspell.yml';
const lines = (await Bun.file(configPath).text()).split('\n');
const wordsSectionIndex = lines.findIndex((line) => /^words:\s*$/.test(line));

if (wordsSectionIndex === -1) {
  throw new Error(`Could not find the words section in ${configPath}`);
}

const words: { line: number; value: string }[] = [];

for (let index = wordsSectionIndex + 1; index < lines.length; index++) {
  const line = lines[index];
  const wordMatch = line.match(/^ {2}- (.*)$/);

  if (wordMatch) {
    words.push({ line: index + 1, value: wordMatch[1] });
    continue;
  }

  if (line.trim() && !line.startsWith(' ')) break;
}

const outOfOrder = words.flatMap((word, index) => {
  if (index === 0) return [];

  const previous = words[index - 1];
  return previous.value.toLowerCase() > word.value.toLowerCase()
    ? [{ previous, word }]
    : [];
});

if (outOfOrder.length > 0) {
  console.error(
    `${configPath}: words must be sorted alphabetically (case-insensitive):`,
  );
  for (const { previous, word } of outOfOrder) {
    console.error(
      `  line ${word.line} "${word.value.slice(0, 40)}" is before line ${previous.line} "${previous.value.slice(0, 40)}"`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`${configPath}: words are sorted alphabetically.`);
}

export default {};
