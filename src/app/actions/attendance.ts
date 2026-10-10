"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { format } from "date-fns";

export async function checkIn(memberId: string) {
  await requireAuth();

  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');

  // Prevent duplicate active check-ins
  const existingActive = await prisma.attendance.findFirst({
    where: {
      memberId,
      checkOut: null,
    }
  });

  if (existingActive) {
    throw new Error("Member is already checked in.");
  }

  await prisma.attendance.create({
    data: {
      memberId,
      checkIn: now,
      date: dateStr,
    }
  });

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
}

export async function checkOut(attendanceId: string) {
  await requireAuth();

  const now = new Date();

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId }
  });

  if (!attendance) {
    throw new Error("Attendance record not found.");
  }

  if (attendance.checkOut) {
    throw new Error("Already checked out.");
  }

  if (now.getTime() < attendance.checkIn.getTime()) {
    throw new Error("Checkout time cannot be before check-in time.");
  }

  await prisma.attendance.update({
    where: { id: attendanceId },
    data: { checkOut: now }
  });

  revalidatePath("/members");
  revalidatePath(`/members/${attendance.memberId}`);
}
