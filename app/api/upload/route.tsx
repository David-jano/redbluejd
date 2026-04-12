import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Use individual exports instead of config object
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for large videos

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate based on bucket type
    let maxSize = 5 * 1024 * 1024; // 5MB default
    let allowedTypes: string[] = [];

    if (bucket === "videos") {
      maxSize = 100 * 1024 * 1024; // 100MB for videos
      allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    } else if (bucket === "thumbnails") {
      maxSize = 5 * 1024 * 1024; // 5MB for thumbnails
      allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    } else {
      allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size is ${maxSize / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadOptions: any = {
      folder: bucket,
      resource_type: bucket === "videos" ? "video" : "image",
    };

    if (bucket === "videos") {
      uploadOptions.eager = [
        { width: 640, height: 360, crop: "fill", format: "mp4" },
        { width: 1280, height: 720, crop: "fill", format: "mp4" },
      ];
      uploadOptions.eager_async = true;
      uploadOptions.transformation = [
        { quality: "auto", fetch_format: "auto" },
      ];
    } else {
      uploadOptions.transformation = [
        { quality: "auto", fetch_format: "auto", crop: "limit" },
      ];
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });

    const uploadedFile = result as any;

    return NextResponse.json({
      url: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      duration: uploadedFile.duration,
      format: uploadedFile.format,
      size: uploadedFile.bytes,
      success: true,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }
}
