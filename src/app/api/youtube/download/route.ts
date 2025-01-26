import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import { isDev } from "~/config/dev-routes";
const BATCH_DIR = path.join(process.cwd(), "tmp", "batch-videos");

export async function GET() {
  if (!isDev) {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  const archive = archiver("zip");
  const zipPath = path.join(BATCH_DIR, "videos.zip");
  const output = fs.createWriteStream(zipPath);

  return new Promise<NextResponse>((resolve, reject) => {
    output.on("close", () => {
      void (async () => {
        try {
          const fileBuffer = await fs.promises.readFile(zipPath);
          const response = new NextResponse(fileBuffer, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": "attachment; filename=youtube-videos.zip",
            },
          });

          // Clean up
          await fs.promises.unlink(zipPath);
          resolve(response);
        } catch (error) {
          reject(
            new Error(error instanceof Error ? error.message : "Unknown error"),
          );
        }
      })();
    });

    archive.pipe(output);
    archive.directory(BATCH_DIR, false);
    void archive.finalize();
  });
}
