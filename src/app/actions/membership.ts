"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, addMonths, startOfDay } from "date-fns";

import { requireAuth } from "@/lib/session";

export async function renewMembership(formData: FormData) {
  const session = await requireAuth();

  const memberId = formData.get("memberId") as string;
  const planId = formData.get("planId") as string;
  const renewalOption = formData.get("renewalOption") as string;
  const customStartDateStr = formData.get("customStartDate") as string;
  const amountPaidStr = formData.get("amountPaid") as string;
  
  const amountPaid = amountPaidStr ? parseFloat(amountPaidStr) : 0;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberships: {
        orderBy: { startDate: 'desc' },
        take: 1
      }
    }
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const currentMembership = member.memberships[0];

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    throw new Error("Invalid plan selected");
  }

  let startDate = new Date();
  
  if (renewalOption === "after-current" && currentMembership) {
    // Start day after current membership ends
    startDate = addDays(currentMembership.endDate, 1);
  } else if (renewalOption === "custom" && customStartDateStr) {
    startDate = startOfDay(new Date(customStartDateStr));
  } else {
    // immediate
    startDate = startOfDay(new Date());
  }

  let endDate = new Date(startDate);
  if (plan.durationMonths) {
    endDate = addMonths(endDate, plan.durationMonths);
  } else if (plan.durationDays) {
    endDate = addDays(endDate, plan.durationDays);
  }

  let discount = parseFloat(formData.get("discount") as string) || 0;
  if (discount < 0 || discount > plan.fee) {
    discount = 0;
  }
  const paymentMethod = formData.get("paymentMethod") as string || "CASH";

  await prisma.membership.create({
    data: {
      memberId,
      planId: plan.id,
      startDate,
      endDate,
      fee: plan.fee,
      discount,
      allocations: amountPaid > 0 ? {
        create: {
          amount: amountPaid,
          payment: {
            create: {
              amount: amountPaid,
              date: new Date(),
              method: paymentMethod, 
              member: { connect: { id: memberId } },
              recordedBy: {
                connect: { id: session.userId }
              }
            }
          }
        }
      } : undefined
    }
  });

  revalidatePath(`/members/${memberId}`);
  redirect(`/members/${memberId}`);
}
