import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import AddMemberForm from "@/components/AddMemberForm";

export default async function NewMemberPage() {
  await connection();
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  const count = await prisma.member.count();
  const nextMemberId = `A1-${String(count + 1).padStart(3, '0')}`;
  
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['admissionFeeEnabled', 'admissionFeeAmount'] } }
  });
  
  const admissionFeeEnabled = settings.find(s => s.key === 'admissionFeeEnabled')?.value === 'true';
  const admissionFeeAmount = parseFloat(settings.find(s => s.key === 'admissionFeeAmount')?.value || '0');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Register New Member</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <AddMemberForm 
          plans={plans}
          nextMemberId={nextMemberId}
          admissionFeeEnabled={admissionFeeEnabled}
          admissionFeeAmount={admissionFeeAmount}
        />
      </div>
    </div>
  );
}
