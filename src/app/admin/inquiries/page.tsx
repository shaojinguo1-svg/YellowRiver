import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ContactInquiry } from "@/generated/prisma/client";
import { InquiriesClient } from "./inquiries-client";

export default async function AdminInquiriesPage() {
  await requireAdmin();

  let inquiries: ContactInquiry[] = [];
  let fetchError = false;

  try {
    inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    fetchError = true;
  }

  // Serialize dates for the client component
  const serializedInquiries = inquiries.map((inquiry) => ({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    repliedAt: inquiry.repliedAt?.toISOString() ?? null,
  }));

  return (
    <InquiriesClient
      inquiries={serializedInquiries}
      fetchError={fetchError}
    />
  );
}
