"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, addMonths, startOfDay } from "date-fns";

import { requireAuth } from "@/lib/session";

export async function createMember(formData: FormData) {
  const session = await requireAuth();
  
  const memberId = formData.get("memberId") as string;
  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const emailAddress = formData.get("emailAddress") as string;
  const planId = formData.get("planId") as string;
  const startDateStr = formData.get("startDate") as string;
  const amountPaidStr = formData.get("amountPaid") as string;
  let discount = parseFloat(formData.get("discount") as string) || 0;
  const paymentMethod = (formData.get("paymentMethod") as string) || "CASH";
  
  // Convert basic types
  const amountPaid = amountPaidStr ? parseFloat(amountPaidStr) : 0;
  const startDate = startOfDay(new Date(startDateStr));

  // Get plan details
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    throw new Error("Invalid plan selected");
  }

  // Fetch admission fee from settings securely
  const settingsRaw = await prisma.setting.findMany({
    where: { key: { in: ['admissionFeeEnabled', 'admissionFeeAmount'] } }
  });
  const settings = settingsRaw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  
  const admissionFee = settings.admissionFeeEnabled === 'true' 
    ? parseFloat(settings.admissionFeeAmount || '0') 
    : 0;

  // Validate discount
  if (discount < 0 || discount > (plan.fee + admissionFee)) {
    discount = 0; // fallback or could throw error
  }

  // Calculate End Date based on Plan duration
  let endDate = new Date(startDate);
  if (plan.durationMonths) {
    endDate = addMonths(endDate, plan.durationMonths);
  } else if (plan.durationDays) {
    endDate = addDays(endDate, plan.durationDays);
  }

  const newMember = await prisma.member.create({
    data: {
      memberId,
      fullName,
      phoneNumber,
      emailAddress,
      memberships: {
        create: {
          planId: plan.id,
          startDate: startDate,
          endDate: endDate,
          fee: plan.fee,
          admissionFee,
          discount,
          allocations: amountPaid > 0 ? {
            create: {
              amount: amountPaid,
              payment: {
                create: {
                  amount: amountPaid,
                  date: new Date(),
                  method: paymentMethod,
                  member: {
                    connect: { memberId }
                  },
                  recordedBy: {
                    connect: { id: session.userId }
                  }
                }
              }
            }
          } : undefined
        }
      }
    }
  });

  revalidatePath("/members");
  redirect(`/members/${newMember.id}`);
}
