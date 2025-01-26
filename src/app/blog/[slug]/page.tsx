import { notFound } from "next/navigation";
import { Header } from "~/components/layout/Header";
import { CircleMenu } from "~/components/layout/CircleMenu";
import { MenuProvider } from "~/context/MenuContext";
import { Footer } from "~/components/layout/Footer";
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
    <MenuProvider>
      <div className="flex min-h-screen flex-col bg-darkpurple">
        <Header />
        <CircleMenu />
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
        <Footer />
      </div>
    </MenuProvider>
  );
}
