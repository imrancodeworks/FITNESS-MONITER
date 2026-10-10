import { prisma } from "@/lib/prisma";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Search } from "lucide-react";

import { connection } from "next/server";

export default async function UnpaidMembersPage() {
  await connection();
  const memberships = await prisma.membership.findMany({
    include: {
      member: true,
      plan: true,
      allocations: true,
    },
    orderBy: { startDate: 'desc' }
  });

  const now = new Date();

  // Filter for memberships with outstanding balance > 0 AND totalPaid === 0
  const unpaidList = memberships.map(m => {
    const totalDue = m.fee + (m.admissionFee || 0) - (m.discount || 0);
    const totalPaid = m.allocations.reduce((sum, a) => sum + a.amount, 0);
    const outstandingBalance = totalDue - totalPaid;
    
    return {
      ...m,
      totalDue,
      totalPaid,
      outstandingBalance,
    };
  }).filter(m => m.outstandingBalance > 0 && m.totalPaid === 0);

  // Sort by highest outstanding balance (as requested in PRD sorting options, I'll default to it)
  unpaidList.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-rose-500">Unpaid Members</h1>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search by name, ID or phone..."
              className="w-full bg-background border border-border rounded-md h-9 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {/* Quick Filters */}
            <button className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md whitespace-nowrap">0-7 Days</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md whitespace-nowrap">8-15 Days</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md whitespace-nowrap">Completely Unpaid</button>
            <button className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-md whitespace-nowrap">Partially Paid</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs uppercase bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Member ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium text-right">Fee</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right text-rose-500">Balance</th>
                <th className="px-4 py-3 font-medium text-center">Payment Status</th>
                <th className="px-4 py-3 font-medium text-center">Days Unpaid</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unpaidList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-zinc-500">
                    No unpaid memberships found. All clear!
                  </td>
                </tr>
              ) : unpaidList.map((m) => {
                const isPartiallyPaid = m.totalPaid > 0;
                
                // Days Unpaid Calculation
                // PRD: "If no payment has been made, calculate from the membership start date."
                // "If a payment is partially made, calculate from the membership start date while an outstanding balance remains."
                // "If the membership is unpaid and the due date is today, show 0 days overdue."
                // "Never calculate negative overdue days."
                const diffDays = differenceInDays(now, m.startDate);
                const daysUnpaid = diffDays > 0 ? diffDays : 0;
                
                const paymentColor = isPartiallyPaid 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";

                return (
                  <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.member.memberId}</td>
                    <td className="px-4 py-3">{m.member.fullName}</td>
                    <td className="px-4 py-3">{m.member.phoneNumber}</td>
                    <td className="px-4 py-3">{m.plan?.name || "Custom"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {format(m.startDate, 'dd MMM yy')} - {format(m.endDate, 'dd MMM yy')}
                    </td>
                    <td className="px-4 py-3 text-right">₹{m.totalDue}</td>
                    <td className="px-4 py-3 text-right">₹{m.totalPaid}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-500">₹{m.outstandingBalance}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentColor}`}>
                        {isPartiallyPaid ? "Partially Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {daysUnpaid} days
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <Link 
                        href={`/payments/new?membershipId=${m.id}`}
                        className="text-emerald-500 hover:text-emerald-600 font-medium text-sm"
                      >
                        Record Payment
                      </Link>
                      <Link 
                        href={`/members/${m.member.id}`}
                        className="text-brand-500 hover:text-brand-600 font-medium text-sm"
                      >
                        View Details
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
