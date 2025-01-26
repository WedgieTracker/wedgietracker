import fs from "fs";
import https from "https";

export async function downloadFile(
  url: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      })
      .on("error", reject);
  });
}
