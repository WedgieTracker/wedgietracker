import { useEffect, useState } from "react";

export function TwitterAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if we have the required Twitter credentials in environment variables
    const hasCredentials = !!(
      process.env.NEXT_PUBLIC_HAS_TWITTER_CREDENTIALS === "true"
    );
    setIsAuthenticated(hasCredentials);
  }, []);

  return (
    <div className="space-y-4">
      {isAuthenticated ? (
        <p className="text-sm text-green-500">
          ✓ Twitter credentials configured
        </p>
      ) : (
        <p className="text-sm text-red-500">
          × Twitter credentials not configured
        </p>
      )}
    </div>
  );
}
