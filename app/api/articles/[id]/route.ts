import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    // Method 1: Try to get from params
    let articleId = params?.id;

    // Method 2: If params is empty, extract from URL
    if (!articleId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      articleId = pathParts[pathParts.length - 1]; // Get the last part of the URL
    }

    console.log("Extracted article ID:", articleId);
    console.log("Full URL:", request.url);
    console.log("Params object:", params);

    if (!articleId || articleId === "undefined" || articleId === "null") {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    console.log("Update data:", body);

    // Validate required fields
    if (!body.title || !body.author || !body.label || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseServer
      .from("articles")
      .update({
        title: body.title,
        author: body.author,
        label: body.label,
        image_url: body.imageUrl || "",
        content: body.content,
        description: body.description || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    console.log("Update successful:", data.id);
    return NextResponse.json({ success: true, article: data }, { status: 200 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also fix the GET method
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    let articleId = params?.id;

    if (!articleId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      articleId = pathParts[pathParts.length - 1];
    }

    console.log("GET - Article ID:", articleId);

    if (!articleId || articleId === "undefined") {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseServer
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Fix the DELETE method as well
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    let articleId = params?.id;

    if (!articleId) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      articleId = pathParts[pathParts.length - 1];
    }

    console.log("DELETE - Article ID:", articleId);

    if (!articleId || articleId === "undefined") {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 },
      );
    }

    const { error } = await supabaseServer
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
