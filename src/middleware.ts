import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_REQUIRED_PREFIXES = ["/notes/create", "/notes/edit"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!AUTH_REQUIRED_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/create", "/notes/edit/:path*"],
};
