// /api/blog

import { z } from "zod";
import { cacheTag, cacheLife } from "next/cache";
import { createTRPCRouter, publicProcedure } from "../trpc";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import "server-only";
import { CACHE_TAGS } from "~/server/cache";

const postsDirectory = path.join(process.cwd(), "content/blog");

// Add these interfaces at the top of the file
interface BlogPostData {
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  author: string;
}

interface BlogPost extends BlogPostData {
  slug: string;
  content: string;
}

function parseBlogPost(slug: string, fullPath: string): BlogPost {
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);
  const { data, content } = matterResult as unknown as {
    data: BlogPostData;
    content: string;
  };

  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    author: data.author,
    content,
  };
}

function getAllPosts(): BlogPost[] {
  return fs
    .readdirSync(postsDirectory)
    .map((fileName) =>
      parseBlogPost(
        fileName.replace(/\.md$/, ""),
        path.join(postsDirectory, fileName),
      ),
    )
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

function getPostBySlug(slug: string): BlogPost {
  return parseBlogPost(slug, path.join(postsDirectory, `${slug}.md`));
}

async function getCachedAllPosts() {
  "use cache";
  cacheTag(CACHE_TAGS.BLOG_DATA);
  cacheLife({ revalidate: 3600 });

  return getAllPosts();
}

async function getCachedPostBySlug(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.BLOG_DATA);
  cacheLife({ revalidate: 3600 });

  return getPostBySlug(slug);
}

export const blogRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => getCachedAllPosts()),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getCachedPostBySlug(input.slug)),
});
