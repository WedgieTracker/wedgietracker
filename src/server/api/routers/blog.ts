// /api/blog

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import "server-only";

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

function getAllPosts(): BlogPost[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
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
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

function getPostBySlug(slug: string): BlogPost {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);
  const { data, content } = matterResult as unknown as {
    data: BlogPostData;
    content: string;
  };

  console.log(data);
  // console the full path
  console.log(fullPath);

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

export const blogRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return getAllPosts();
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return getPostBySlug(input.slug);
    }),
});
