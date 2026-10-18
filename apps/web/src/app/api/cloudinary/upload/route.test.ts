// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.fn();
vi.mock("~/server/auth", () => ({ auth }));
vi.mock("~/server/auth/config", () => ({
  isAllowedEmail: (email?: string | null) => email === "admin@example.com",
}));
const end = vi.fn();
const uploadStream = vi.fn(
  (_opts: unknown, cb: (e: unknown, r: unknown) => void) => ({
    end: (buf: unknown) => {
      end(buf);
      cb(null, { secure_url: "https://cdn.example/v.mp4" });
    },
  }),
);
vi.mock("~/server/services/cloudinary", () => ({
  cloudinary: { uploader: { upload_stream: uploadStream } },
}));

const { POST } = await import("./route");

function uploadRequest() {
  const form = new FormData();
  form.set("file", new File(["video"], "clip.mp4", { type: "video/mp4" }));
  return new Request("http://localhost/api/cloudinary/upload", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/cloudinary/upload", () => {
  beforeEach(() => {
    auth.mockReset();
    uploadStream.mockClear();
  });

  it("rejects requests without a session", async () => {
    auth.mockResolvedValue(null);
    const res = await POST(uploadRequest());
    expect(res.status).toBe(401);
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it("rejects signed-in users outside the allowlist", async () => {
    auth.mockResolvedValue({ user: { email: "someone@example.com" } });
    const res = await POST(uploadRequest());
    expect(res.status).toBe(403);
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it("uploads for an allowlisted admin", async () => {
    auth.mockResolvedValue({ user: { email: "admin@example.com" } });
    const res = await POST(uploadRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://cdn.example/v.mp4" });
  });
});
