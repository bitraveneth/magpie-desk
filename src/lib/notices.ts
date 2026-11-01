import { prisma } from "@/lib/db";
import { remember } from "@/lib/read-cache";

export async function notifyRequirement(requirementId: string, kind: string, message: string) {
  await prisma.deskNotice.create({
    data: { requirementId, kind, message },
  });
}

export async function listNotices() {
  return remember("notices", () => prisma.deskNotice.findMany({
    where: { readAt: null },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { requirement: { select: { id: true, title: true, number: true } } },
  }));
}

export async function markRequirementNoticesRead(requirementId: string) {
  await prisma.deskNotice.updateMany({
    where: { requirementId, readAt: null },
    data: { readAt: new Date() },
  });
}
