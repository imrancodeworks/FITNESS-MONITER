"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";

async function upsertSetting(key: string, value: string, description?: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value, ...(description && { description }) },
    create: { key, value, ...(description && { description }) }
  });
}

export async function updateGymSettings(formData: FormData) {
  await requireAuth();
  
  const fields = ['gymName', 'gymPhone', 'gymEmail', 'gymAddress', 'currency', 'receiptFooter', 'expiryWarningDays'];
  
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) {
      await upsertSetting(field, val.toString());
    }
  }
  
  revalidatePath('/settings');
  revalidatePath('/');
}

export async function updateAdmissionFee(formData: FormData) {
  await requireAuth();
  
  const enabled = formData.get('admissionFeeEnabled') === 'true' ? 'true' : 'false';
  const amount = formData.get('admissionFeeAmount')?.toString() || '0';
  const description = formData.get('admissionFeeDescription')?.toString() || '';
  
  await upsertSetting('admissionFeeEnabled', enabled);
  await upsertSetting('admissionFeeAmount', amount);
  await upsertSetting('admissionFeeDescription', description);
  
  revalidatePath('/settings');
}

export async function updatePaymentSettings(formData: FormData) {
  await requireAuth();
  
  const fields = ['paymentMethodCash', 'paymentMethodUPI', 'paymentMethodBank'];
  for (const field of fields) {
    const val = formData.get(field) === 'true' ? 'true' : 'false';
    await upsertSetting(field, val);
  }
  
  revalidatePath('/settings');
}

export async function addMembershipPlan(formData: FormData) {
  await requireAuth();
  
  const name = formData.get("name") as string;
  const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
  const fee = parseFloat(formData.get("fee") as string);
  const isActive = formData.get("isActive") === 'true';

  if (!name || isNaN(durationMonths) || isNaN(fee) || fee < 0) {
    throw new Error("Invalid plan details");
  }

  await prisma.membershipPlan.create({
    data: {
      name,
      durationMonths,
      fee,
      isActive,
      order: 0
    }
  });

  revalidatePath('/settings');
}

export async function toggleMembershipPlan(id: string, isActive: boolean) {
  await requireAuth();
  await prisma.membershipPlan.update({
    where: { id },
    data: { isActive }
  });
  revalidatePath('/settings');
}

export async function editMembershipPlan(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const durationMonths = parseInt(formData.get("durationMonths") as string, 10);
  const fee = parseFloat(formData.get("fee") as string);
  
  if (!id || !name || isNaN(durationMonths) || durationMonths < 1 || isNaN(fee) || fee < 0) {
    throw new Error("Invalid plan details");
  }

  const existingPlan = await prisma.membershipPlan.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } }
  });

  if (!existingPlan) throw new Error("Plan not found");

  if (existingPlan._count.memberships > 0) {
    // If referenced, disable old and create new to preserve history
    await prisma.$transaction([
      prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false }
      }),
      prisma.membershipPlan.create({
        data: {
          name,
          durationMonths,
          fee,
          isActive: existingPlan.isActive,
          order: existingPlan.order
        }
      })
    ]);
  } else {
    // If not referenced, safe to update in place
    await prisma.membershipPlan.update({
      where: { id },
      data: { name, durationMonths, fee }
    });
  }

  revalidatePath('/settings');
}
