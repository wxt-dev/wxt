import { type ContentData, createContentLoader } from 'vitepress';
import { PostFrontmatter } from '../utils/types';

declare const data: Array<ContentData & { frontmatter: PostFrontmatter }>;
export { data };

export default createContentLoader<
  Array<ContentData & { frontmatter: PostFrontmatter }>
>('blog/*.md');
