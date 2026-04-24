import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { publicId, resourceType = "raw" } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID required" },
        { status: 400 },
      );
    }

    // Ensure public ID has .pdf extension for raw files
    let finalPublicId = publicId;
    if (resourceType === "raw" && !publicId.endsWith(".pdf")) {
      finalPublicId = `${publicId}.pdf`;
    }

    // Generate a signed URL that expires in 1 hour
    const signedUrl = cloudinary.url(finalPublicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate URL" },
      { status: 500 },
    );
  }
}
