import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds for large files

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // File type and size validation
    let maxSize = 5 * 1024 * 1024; // 5MB default
    let allowedTypes: string[] = [];
    let resourceType: "image" | "video" | "raw" = "image";

    // Bucket-based configuration
    if (bucket === "videos") {
      maxSize = 100 * 1024 * 1024; // 100MB for videos
      allowedTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ];
      resourceType = "video";
    } else if (bucket === "thumbnails") {
      maxSize = 5 * 1024 * 1024; // 5MB for thumbnails
      allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      resourceType = "image";
    } else if (bucket === "pdfs" || file.type === "application/pdf") {
      // PDF bucket or PDF file detection
      maxSize = 50 * 1024 * 1024; // 50MB for PDFs
      allowedTypes = ["application/pdf"];
      resourceType = "raw"; // Cloudinary raw for PDFs
    } else {
      // Default uploads bucket (images)
      allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      resourceType = "image";
    }

    // Special handling for PDFs in default bucket
    if (bucket === "uploads" && file.type === "application/pdf") {
      maxSize = 50 * 1024 * 1024;
      allowedTypes = ["application/pdf"];
      resourceType = "raw";
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
          receivedType: file.type,
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size is ${maxSize / 1024 / 1024}MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with Vercel optimization
    const uploadOptions: any = {
      folder: bucket,
      resource_type: resourceType,
      timeout: 120000, // 120 seconds timeout for Vercel serverless
    };

    // Apply transformations based on file type
    if (resourceType === "video") {
      uploadOptions.eager = [
        { width: 640, height: 360, crop: "fill", format: "mp4" },
        { width: 1280, height: 720, crop: "fill", format: "mp4" },
      ];
      uploadOptions.eager_async = true;
      uploadOptions.transformation = [
        { quality: "auto", fetch_format: "auto" },
      ];
    } else if (resourceType === "image") {
      uploadOptions.transformation = [
        { quality: "auto", fetch_format: "auto", crop: "limit" },
      ];
    } else if (resourceType === "raw") {
      // For PDFs, don't transform, just upload
      uploadOptions.format = "pdf";
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = true;
    }

    // Upload with promise wrapper
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

    // Return response with appropriate fields
    const response: any = {
      url: uploadedFile.secure_url,
      publicId: uploadedFile.public_id,
      success: true,
    };

    // Add type-specific fields
    if (resourceType === "video" && uploadedFile.duration) {
      response.duration = uploadedFile.duration;
    }

    if (uploadedFile.format) {
      response.format = uploadedFile.format;
    }

    if (uploadedFile.bytes) {
      response.size = uploadedFile.bytes;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Upload error:", error);

    // Handle specific Cloudinary errors
    if (error.message?.includes("File size too large")) {
      return NextResponse.json(
        { error: "File too large for Cloudinary. Maximum size is 100MB." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
