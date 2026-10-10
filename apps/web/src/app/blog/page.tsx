import { permanentRedirect } from "next/navigation";

// The blog's only post told WedgieTracker's story, which /history now does.
export default function BlogPage() {
  permanentRedirect("/history");
}
