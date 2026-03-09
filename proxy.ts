import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { DEFAULT_AUTH_REDIRECT } from "@/features/auth/constants";

const publicRoutes = new Set(["/login", "/signup"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublicRoute = publicRoutes.has(pathname);
  const token = await getToken({
    req: request,
    ...(process.env.NEXTAUTH_SECRET
      ? { secret: process.env.NEXTAUTH_SECRET }
      : {}),
  });

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
  }

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
