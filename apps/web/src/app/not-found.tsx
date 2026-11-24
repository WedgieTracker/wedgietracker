import Link from "~/components/shared/HoverLink";
import { PageLayout } from "~/components/layout/PageLayout";
import { ErrorScreen } from "~/components/shared/ErrorScreen";

export default function NotFound() {
  return (
    <PageLayout showCircleMenu={false}>
      <ErrorScreen code="404" title="Page not found">
        <Link href="/" className="btn-sticker w-full max-w-60 px-6 text-base">
          Go home
        </Link>
      </ErrorScreen>
    </PageLayout>
  );
}
