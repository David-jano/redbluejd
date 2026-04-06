import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.author || !body.label || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, author, label, content are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("articles")
      .insert([
        {
          title: body.title,
          author: body.author,
          label: body.label,
          image_url: body.imageUrl || "",
          content: body.content,
          description: body.description || "",
          button_text: "SOMA BIRAMBUYE",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, article: data },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let query = supabaseServer.from("articles").select("*");

    if (id) {
      const { data, error } = await query.eq("id", parseInt(id)).single();
      
      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: true, data },
        { status: 200 }
      );
    } else {
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: true, data },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error occurred" },
      { status: 500 }
    );
  }
}