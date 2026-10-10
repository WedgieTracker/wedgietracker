import { redirect } from "next/navigation";

// Checkouts started before the store was retired still return here.
export default function StoreSuccessPage() {
  redirect("/support-us/thanks");
}
