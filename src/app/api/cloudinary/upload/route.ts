import { NextResponse } from "next/server";
import { cloudinary } from "~/server/services/cloudinary";

// Add interface for Cloudinary response
interface CloudinaryResponse {
  secure_url: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with proper error and response typing
    const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "video",
            folder: "wedgies",
          },
          (error, result) => {
            if (error) reject(new Error(error.message));
            resolve(result as CloudinaryResponse);
          },
        )
        .end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
