"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/session";

export async function recordPayment(formData: FormData) {
  const session = await requireAuth();

  const membershipId = formData.get("membershipId") as string;
  const amountStr = formData.get("amount") as string;
  const method = formData.get("method") as string;
  const referenceNumber = formData.get("referenceNumber") as string;
  const notes = formData.get("notes") as string;
  const dateStr = formData.get("date") as string;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { 
      member: true,
      allocations: true
    }
  });

  if (!membership) {
    throw new Error("Membership not found");
  }
  
  const totalDue = membership.fee + (membership.admissionFee || 0) - (membership.discount || 0);
  const totalPaid = membership.allocations.reduce((sum, a) => sum + a.amount, 0);
  const balance = totalDue - totalPaid;

  if (amount > balance && balance > 0) {
    throw new Error(`Amount exceeds outstanding balance (₹${balance})`);
  } else if (balance <= 0) {
    throw new Error("Membership is already fully paid.");
  }

  const date = new Date(dateStr);

  await prisma.payment.create({
    data: {
      amount,
      method,
      referenceNumber,
      notes,
      date,
      member: { connect: { id: membership.memberId } },
      // Create allocation automatically to the selected membership
      allocations: {
        create: {
          amount,
          membership: { connect: { id: membershipId } }
        }
      },
      recordedBy: {
        connect: { id: session.userId }
      }
    }
  });

  revalidatePath(`/members/${membership.memberId}`);
  revalidatePath("/unpaid");
  redirect(`/members/${membership.memberId}`);
}
