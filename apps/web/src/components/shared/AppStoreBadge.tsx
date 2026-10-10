export const APP_STORE_URL =
  "https://apps.apple.com/app/wedgietracker/id6811376841";

// Apple's official "Download on the App Store" badge, unmodified. Apple's
// guidelines require a minimum height of 40px on screen.
export function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-opacity duration-300 hover:opacity-80 lg:hidden ${className}`}
    >
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        width={120}
        height={40}
        className="h-10 w-auto"
      />
    </a>
  );
}
