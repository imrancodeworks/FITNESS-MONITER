import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { connection } from "next/server";
import RenewMembershipForm from "@/components/RenewMembershipForm";

export default async function RenewMembershipPage({ searchParams }: { searchParams: { memberId?: string } }) {
  await connection();
  const sp = await searchParams;
  const memberId = sp.memberId;

  if (!memberId) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center border rounded-xl bg-card">
        <h2 className="text-xl font-bold mb-4">No Member Selected</h2>
        <p className="mb-6 text-zinc-500">Please select a member to renew their membership.</p>
        <Link href="/members" className="text-brand-500 hover:underline">Go to All Members</Link>
      </div>
    );
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberships: {
        orderBy: { startDate: 'desc' },
        take: 1,
        include: { plan: true }
      }
    }
  });

  if (!member) {
    notFound();
  }

  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  const currentMembership = member.memberships[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Renew Membership</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-border">
          <div>
            <h3 className="font-medium text-lg mb-1">{member.fullName}</h3>
            <p className="text-sm text-zinc-500">{member.memberId}</p>
          </div>
          {currentMembership && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 flex items-center justify-end gap-1"><Calendar className="h-3 w-3"/> Current Expiry</p>
              <p className="font-medium">{format(currentMembership.endDate, 'dd MMM yyyy')}</p>
            </div>
          )}
        </div>

        <RenewMembershipForm member={member} plans={plans} />
      </div>
    </div>
  );
}
