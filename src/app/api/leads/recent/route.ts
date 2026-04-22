import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 10)));

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      email: true,
      product: true,
      loanAmount: true,
      score: true,
      status: true,
      source: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ leads });
}
