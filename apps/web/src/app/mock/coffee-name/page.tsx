import { PageLayout } from "~/components/layout/PageLayout";
import { CoffeeNameFormMock } from "~/components/support/CoffeeNameFormMock";

// MOCK page for choosing a design; removed before the leaderboard ships.
export const metadata = { robots: { index: false, follow: false } };

export default function CoffeeNameMockPage() {
  return (
    <PageLayout>
      <CoffeeNameFormMock />
    </PageLayout>
  );
}
