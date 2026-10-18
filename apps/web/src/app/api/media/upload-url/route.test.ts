// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/auth/allowlist", () => ({
  isAllowedEmail: (email?: string | null) => email === "admin@example.com",
}));
const presignUpload = vi.fn((key: string, _contentType: string) =>
  Promise.resolve({
    uploadUrl: `https://r2.example/${key}?sig`,
    cacheControl: "public",
    publicUrl: `https://media.example/${key}`,
  }),
);
vi.mock("~/server/services/r2", () => ({ presignUpload }));

const { POST } = await import("./route");

function request(body: unknown) {
  return new Request("http://localhost/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/media/upload-url", () => {
  beforeEach(() => {
    auth.mockReset();
    presignUpload.mockClear();
  });

  it("rejects requests without a session", async () => {
    auth.mockResolvedValue(null);
    const res = await POST(request({ contentType: "video/mp4" }));
    expect(res.status).toBe(401);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("rejects signed-in users outside the allowlist", async () => {
    auth.mockResolvedValue({ user: { email: "someone@example.com" } });
    const res = await POST(request({ contentType: "video/mp4" }));
    expect(res.status).toBe(403);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("rejects types that aren't video", async () => {
    auth.mockResolvedValue({ user: { email: "admin@example.com" } });
    const res = await POST(request({ contentType: "text/html" }));
    expect(res.status).toBe(400);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("signs a fresh key under wedgies/ for an admin", async () => {
    auth.mockResolvedValue({ user: { email: "admin@example.com" } });
    const res = await POST(request({ contentType: "video/mp4" }));
    expect(res.status).toBe(200);
    const [key, contentType] = presignUpload.mock.calls[0]!;
    expect(key).toMatch(/^wedgies\/[0-9a-f-]{36}\.mp4$/);
    expect(contentType).toBe("video/mp4");
    expect(await res.json()).toMatchObject({
      publicUrl: `https://media.example/${key}`,
    });
  });
});
