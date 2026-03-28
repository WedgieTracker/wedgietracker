import { AdminDash } from "~/components/admin/dash";
import { generateMetadata } from "~/config/metadata";

export const metadata = generateMetadata({
  title: "Admin",
  description: "Admin dashboard",
});

export default function Home() {
  return <AdminDash />;
}
