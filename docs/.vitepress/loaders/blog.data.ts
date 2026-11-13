import { type ContentData, createContentLoader } from 'vitepress';

import { PostFrontmatter } from '../utils/types';

declare const data: Array<ContentData & { frontmatter: PostFrontmatter }>;
export { data };

export default createContentLoader<
  Array<ContentData & { frontmatter: PostFrontmatter }>
>('blog/*.md', {
  transform: (posts) =>
    posts.sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime(),
    ),
});
