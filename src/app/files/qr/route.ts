import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.paymentSettings.findUnique({ where: { id: "payments" } });
  if (!settings?.qrImage || !settings.qrMime) {
    return new NextResponse("No company QR yet", { status: 404 });
  }
  return new NextResponse(Buffer.from(settings.qrImage), {
    headers: {
      "Content-Type": settings.qrMime,
      "Cache-Control": "private, max-age=60",
    },
  });
}
