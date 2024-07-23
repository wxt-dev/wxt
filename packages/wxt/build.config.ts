import { defineBuildConfig } from 'unbuild';

const basePattern = ['**/*', '!**/__tests__', '!**/*.md'];

export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: 'src',
      declaration: true,
      pattern: [...basePattern, '!virtual'],
      addRelativeDeclarationExtensions: true,
    },
    {
      builder: 'mkdist',
      input: 'src/virtual',
      outDir: 'dist/virtual',
      pattern: basePattern,
    },
  ],
});
