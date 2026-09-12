export const INSTAGRAM_CONFIG = {
  clientId: process.env.INSTAGRAM_CLIENT_ID ?? "",
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET ?? "",
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/instagram/callback`,
};

export function getInstagramAuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_CONFIG.clientId,
    redirect_uri: INSTAGRAM_CONFIG.redirectUri,
    response_type: "code",
    scope: [
      "instagram_business_basic",
      "instagram_business_content_publish",
    ].join(","),
    enable_fb_login: "0",
    force_authentication: "1",
  });
  if (state) params.set("state", state);

  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}
