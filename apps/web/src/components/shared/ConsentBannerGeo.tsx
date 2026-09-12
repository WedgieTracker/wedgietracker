import { headers } from "next/headers";
import { isConsentRequiredCountry } from "~/lib/consent-region";
import ConsentBanner from "./ConsentBanner";

export default async function ConsentBannerGeo() {
  const country = (await headers()).get("x-vercel-ip-country");
  const requiresConsent = isConsentRequiredCountry(country);
  return <ConsentBanner requiresConsent={requiresConsent} />;
}
