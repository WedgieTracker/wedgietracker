import fs from "fs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

// Every object is written once under a fresh key and never overwritten.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  // The SDK otherwise adds a CRC32 checksum header that a browser PUT to a
  // presigned URL can't supply.
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export function publicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`;
}

/** A URL the browser can PUT one file to for the next 15 minutes. */
export async function presignUpload(key: string, contentType: string) {
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
    }),
    { expiresIn: 15 * 60 },
  );
  return { uploadUrl, cacheControl: CACHE_CONTROL, publicUrl: publicUrl(key) };
}

/** Uploads a local file and returns its public URL. */
export async function uploadFile(
  path: string,
  key: string,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: await fs.promises.readFile(path),
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
    }),
  );
  return publicUrl(key);
}
