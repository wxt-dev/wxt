import { defineBuildConfig } from 'unbuild';

const basePattern = ['**/*', '!**/__tests__', '!**/*.md'];

export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: 'src',
      pattern: [...basePattern, '!virtual'],
      declaration: true,
    },
    {
      builder: 'mkdist',
      input: 'src/virtual',
      pattern: basePattern,
      outDir: 'dist/virtual',
    },
  ],
});
