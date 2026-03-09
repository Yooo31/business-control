import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    companyId: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { companyId } = await context.params;
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!company) {
    return NextResponse.json({ message: "Company not found." }, { status: 404 });
  }

  await prisma.company.delete({
    where: {
      id: company.id,
    },
  });

  return NextResponse.json({ success: true });
}
