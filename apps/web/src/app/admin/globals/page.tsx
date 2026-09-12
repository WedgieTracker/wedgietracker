import { Suspense } from "react";
import { GlobalSettingsForm } from "~/components/admin/GlobalSettingsForm";

export default async function GlobalSettingsPage() {
  return (
    <>
      <h2 className="mb-6 text-2xl font-bold text-white">Global Settings</h2>
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <GlobalSettingsForm />
      </Suspense>
    </>
  );
}
