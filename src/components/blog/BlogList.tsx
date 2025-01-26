"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { Loader } from "~/components/loader";
export function BlogList() {
  const { data: posts, isLoading } = api.blog.getAll.useQuery();
  // return <LoaderWrapper />;
  if (isLoading) return <LoaderWrapper />;

  if (!posts) return <NoPosts />;

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2 [&>*:last-child]:md:col-span-2 [&>*:last-child]:md:mx-auto [&>*:last-child]:md:max-w-[calc(50%-1rem)]">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="group relative overflow-hidden rounded-lg bg-darkpurple-lighter p-4 transition-all hover:bg-darkpurple-light/80 md:p-6"
        >
          {post.coverImage && (
            <div className="mb-4 aspect-video overflow-hidden rounded-lg">
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="space-y-2">
            <p className="inline-block rounded-md bg-darkpurple-darker px-2 py-1 text-xs font-bold uppercase text-white">
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h2 className="text-2xl font-black text-yellow md:text-3xl lg:text-4xl">
              {post.title}
            </h2>
            <p className="text-sm text-white/60">{post.excerpt}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

const LoaderWrapper = () => {
  return (
    <div className="items-top flex w-full justify-center">
      <div className="-mr-[3em] w-full max-w-[100px] md:max-w-[200px]">
        <Loader />
      </div>
    </div>
  );
};

const NoPosts = () => {
  return (
    <div className="items-top flex w-full justify-center">
      <p className="text-white">No posts found</p>
    </div>
  );
};
