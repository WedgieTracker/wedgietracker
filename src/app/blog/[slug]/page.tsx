import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageLayout } from "~/components/layout/PageLayout";
import { BlogPost } from "~/components/blog/BlogPost";
import { api } from "~/trpc/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Loader } from "~/components/shared/Loader";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default function BlogPostPage({ params }: Props) {
  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link href="/blog">
          <Button
            variant="ghost"
            className="hover:bg-yellow hover:text-darkpurple mb-4 text-white/60"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
        <Suspense
          fallback={
            <div className="flex min-h-[60svh] items-center justify-center">
              <Loader />
            </div>
          }
        >
          <BlogPostBody params={params} />
        </Suspense>
      </div>
    </PageLayout>
  );
}

async function BlogPostBody({ params }: Props) {
  const resolvedParams = await params;
  const post = await api.blog.getBySlug({ slug: resolvedParams.slug });

  if (!post) {
    notFound();
  }

  return <BlogPost post={post} />;
}
