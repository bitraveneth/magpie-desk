import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDesk } from "@/lib/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDesk();
  const { id } = await params;
  const file = await prisma.requirementFile.findFirst({
    where: { requirementId: id, questionId: "__signed_copy" },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.mime || "application/pdf",
      "Content-Disposition": `attachment; filename="${file.fileName.replace(/[^A-Za-z0-9._-]/g, "-")}"`,
    },
  });
}
