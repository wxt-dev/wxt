import { type ContentData, createContentLoader } from 'vitepress';

export interface PostFrontmatter {
  title: string;
  description?: string;
  date: string;
  authors: { name: string; github: string }[];
}

export interface Post
  extends Omit<ContentData, 'frontmatter'>, Omit<PostFrontmatter, 'date'> {
  date: Date;
}

declare const data: Array<ContentData & { frontmatter: PostFrontmatter }>;
export { data };

export default createContentLoader<
  Array<ContentData & { frontmatter: PostFrontmatter }>
>('blog/*.md');
