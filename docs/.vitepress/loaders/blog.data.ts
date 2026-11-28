import type { ContentData } from 'vitepress';
import { createContentLoader } from 'vitepress';

import type { PostFrontmatter } from '../utils/types';

declare const data: Array<ContentData & { frontmatter: PostFrontmatter }>;
export { data };

export default createContentLoader<
  Array<ContentData & { frontmatter: PostFrontmatter }>
>('blog/*.md');
