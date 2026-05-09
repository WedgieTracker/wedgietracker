"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { Loader } from "~/components/shared/Loader";
export function BlogList() {
  const { data: posts, isLoading } = api.blog.getAll.useQuery();
  // return <LoaderWrapper />;
  if (isLoading) return <LoaderWrapper />;

  if (!posts) return <NoPosts />;

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 md:grid-cols-2 md:[&>*:last-child]:col-span-2 md:[&>*:last-child]:mx-auto md:[&>*:last-child]:max-w-[calc(50%-1rem)]">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="group bg-darkpurple-lighter hover:bg-darkpurple-light/80 relative overflow-hidden rounded-lg p-4 transition-all md:p-6"
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
            <p
              suppressHydrationWarning
              className="bg-darkpurple-darker inline-block rounded-md px-2 py-1 text-xs font-bold text-white uppercase"
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <h2 className="text-yellow text-2xl font-black md:text-3xl lg:text-4xl">
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
