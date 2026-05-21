// middleware.ts - Completely disabled
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Completely disabled - allow all access
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
