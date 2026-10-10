import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { Search } from "lucide-react";
import { connection } from "next/server";

export default async function PartiallyPaidPage() {
  await connection();
  const memberships = await prisma.membership.findMany({
    include: {
      member: true,
      plan: true,
      allocations: {
        include: { payment: true }
      },
    },
    orderBy: { startDate: 'desc' }
  });

  const now = new Date();

  // Filter for memberships with outstanding balance > 0 and totalPaid > 0
  const partiallyPaidList = memberships.map(m => {
    const totalDue = m.fee + (m.admissionFee || 0) - (m.discount || 0);
    const totalPaid = m.allocations.reduce((sum, a) => sum + a.amount, 0);
    const outstandingBalance = totalDue - totalPaid;
    
    // Find last payment date
    let lastPaymentDate = null;
    if (m.allocations.length > 0) {
      const dates = m.allocations.map(a => new Date(a.payment.date).getTime());
      lastPaymentDate = new Date(Math.max(...dates));
    }
    
    return {
      ...m,
      totalDue,
      totalPaid,
      outstandingBalance,
      lastPaymentDate
    };
  }).filter(m => m.outstandingBalance > 0 && m.totalPaid > 0);

  partiallyPaidList.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-amber-500">Partially Paid</h1>
          <p className="text-muted-foreground mt-1">Members with an outstanding balance who have made at least one payment.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search by name, ID or phone..."
              className="w-full bg-background border border-border rounded-md h-9 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Membership</th>
                <th className="px-6 py-4 text-right">Total Due</th>
                <th className="px-6 py-4 text-right">Amount Paid</th>
                <th className="px-6 py-4 text-right">Outstanding</th>
                <th className="px-6 py-4 text-center">Last Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {partiallyPaidList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No partially paid memberships found.
                  </td>
                </tr>
              ) : partiallyPaidList.map((m) => {
                return (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/members/${m.member.id}`} className="font-medium hover:underline">
                        {m.member.fullName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{m.member.memberId}</div>
                      <div className="text-xs text-muted-foreground">{m.member.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{m.plan?.name || "Custom"}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(m.startDate, 'MMM dd, yyyy')} - {format(m.endDate, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">₹{m.totalDue}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">₹{m.totalPaid}</td>
                    <td className="px-6 py-4 text-right font-bold text-amber-500">₹{m.outstandingBalance}</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      {m.lastPaymentDate ? format(m.lastPaymentDate, 'MMM dd, yyyy') : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link 
                        href={`/members/${m.member.id}`}
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 h-8 px-3 transition-colors"
                      >
                        Record Payment
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
