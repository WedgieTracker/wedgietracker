import { Suspense } from "react";
import { GlobalSettingsForm } from "~/components/admin/GlobalSettingsForm";

export default async function GlobalSettingsPage() {
  return (
    <>
      <h2 className="text-cream mb-6 text-2xl font-bold">Global Settings</h2>
      <Suspense fallback={<div className="text-cream">Loading...</div>}>
        <GlobalSettingsForm />
      </Suspense>
    </>
  );
}
