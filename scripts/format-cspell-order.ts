const configPath = 'cspell.yml';
const originalConfig = await Bun.file(configPath).text();
const lines = originalConfig.split('\n');
const wordsSectionIndex = lines.findIndex((line) => /^words:\s*$/.test(line));

if (wordsSectionIndex === -1) {
  throw new Error(`Could not find the words section in ${configPath}`);
}

const wordLines: { index: number; line: string; value: string }[] = [];

for (let index = wordsSectionIndex + 1; index < lines.length; index++) {
  const line = lines[index];
  const wordMatch = line.match(/^ {2}- (.*)$/);

  if (wordMatch) {
    wordLines.push({ index, line, value: wordMatch[1] });
    continue;
  }

  if (line.trim() && !line.startsWith(' ')) break;
}

const sortedWordLines = [...wordLines].sort((a, b) => {
  const first = a.value.toLowerCase();
  const second = b.value.toLowerCase();
  return first < second ? -1 : first > second ? 1 : 0;
});

for (const [index, wordLine] of wordLines.entries()) {
  lines[wordLine.index] = sortedWordLines[index].line;
}

const sortedConfig = lines.join('\n');

if (sortedConfig !== originalConfig) {
  await Bun.write(configPath, sortedConfig);
  console.log(`${configPath}: sorted words alphabetically.`);
} else {
  console.log(`${configPath}: words are already sorted alphabetically.`);
}

export default {};
