import { redirect } from "next/navigation";

// The T-shirt store is retired; old links go to the coffee page.
export default function StorePage() {
  redirect("/support-us");
}
