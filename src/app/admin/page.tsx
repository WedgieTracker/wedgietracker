import { api } from "~/trpc/server";
import { AdminDash } from "~/components/admin/dash";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Admin",
  description: "Admin dashboard",
});

export default async function Home() {
  void api.admin.getGlobal.prefetch();

  return <AdminDash />;
}
