export const dynamic = "force-static";
export const revalidate = 3600;

import { notFound } from "next/navigation";
import { PageLayout } from "~/components/layout/PageLayout";
import { BlogPost } from "~/components/blog/BlogPost";
import { api } from "~/trpc/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await api.blog.getBySlug({ slug: resolvedParams.slug });

  if (!post) {
    notFound();
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link href="/blog">
          <Button
            variant="ghost"
            className="mb-4 text-white/60 hover:bg-yellow hover:text-darkpurple"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
        <BlogPost post={post} />
      </div>
    </PageLayout>
  );
}
