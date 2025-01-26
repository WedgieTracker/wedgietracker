"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeExternalLinks from "rehype-external-links";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";
import { TwitterEmbed } from "~/components/TwitterEmbed";
import type { BlogPost as BlogPostType } from "~/types/blog";
import type { ReactNode } from "react";
import { Newsletter } from "~/components/home/Newsletter";

// Define proper types for markdown node properties
interface MarkdownNode {
  tagName?: string;
  children?: MarkdownNode[];
  properties?: {
    href?: string;
  };
}

type ExtendedComponents = Components & {
  newsletter: React.ComponentType<ReactNode>;
};

interface BlogPostProps {
  post: BlogPostType;
}

export function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="prose prose-invert mx-auto max-w-2xl">
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="mb-8 aspect-video w-full rounded-xl object-cover"
        />
      )}
      <h1 className="mb-4 text-4xl font-black text-yellow md:text-5xl">
        {post.title}
      </h1>
      <div className="flex flex-row gap-2">
        <p className="m-0 mb-0 p-0 text-sm font-bold text-white/60">
          {post.author}
        </p>
        <time className="m-0 mb-0 block p-0 text-sm text-white/60">
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
      <div className="prose-yellow prose-headings:text-yellow prose-a:text-pink">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeRaw,
            [
              rehypeExternalLinks,
              { target: "_blank", rel: ["nofollow", "noopener", "noreferrer"] },
            ],
          ]}
          components={
            {
              img: ({ ...props }) => (
                <img
                  {...props}
                  alt={props.alt ?? ""}
                  className="mx-auto w-full max-w-md rounded-lg"
                  loading="lazy"
                />
              ),
              iframe: ({ ...props }) => (
                <div className="aspect-video w-full">
                  <iframe
                    {...props}
                    className="h-full w-full max-w-md rounded-lg"
                  />
                </div>
              ),
              a: ({ children, href, ...props }) => {
                const isExternal = href?.startsWith("http");
                return (
                  <a
                    href={href}
                    {...props}
                    className="inline-flex items-center gap-1 hover:opacity-80"
                  >
                    {children}
                    {isExternal && <ExternalLink className="h-4 w-4" />}
                  </a>
                );
              },
              blockquote: ({ children, ...props }) => {
                const node = props.node as MarkdownNode;
                // Handle multiple tweet URLs in one blockquote
                const tweetUrls = node?.children
                  ?.filter((child) => child?.tagName === "a")
                  ?.map((child) => child?.properties?.href)
                  .filter((href): href is string => typeof href === "string");

                if (tweetUrls?.length && tweetUrls.length > 0) {
                  return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {tweetUrls.map((url) => {
                        const tweetId = url
                          ?.split("/status/")?.[1]
                          ?.split("?")?.[0];
                        return tweetId ? (
                          <TwitterEmbed key={tweetId} tweetId={tweetId} />
                        ) : null;
                      })}
                    </div>
                  );
                }

                return <blockquote {...props}>{children}</blockquote>;
              },
              newsletter: () => <Newsletter />,
            } as ExtendedComponents
          }
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
