import type { NextRequest } from "next/server";
import NextAuth from "next-auth/next";

import { authOptions } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    nextauth: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const response = (await NextAuth(request, context, authOptions)) as Response;

  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const response = (await NextAuth(request, context, authOptions)) as Response;

  return response;
}
