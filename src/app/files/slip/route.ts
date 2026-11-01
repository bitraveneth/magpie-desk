import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.paymentSettings.findUnique({ where: { id: "payments" } });
  if (!settings?.slipImage || !settings.slipMime) {
    return new NextResponse("No bank slip yet", { status: 404 });
  }
  return new NextResponse(Buffer.from(settings.slipImage), {
    headers: {
      "Content-Type": settings.slipMime,
      "Cache-Control": "private, max-age=60",
    },
  });
}
