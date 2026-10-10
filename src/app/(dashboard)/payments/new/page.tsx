import { prisma } from "@/lib/prisma";
import { recordPayment } from "@/app/actions/payment";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";

import { connection } from "next/server";

export default async function RecordPaymentPage({ searchParams }: { searchParams: { membershipId?: string, memberId?: string } }) {
  await connection();
  // Await searchParams in Next.js 15
  const sp = await searchParams;
  const membershipId = sp.membershipId;

  if (!membershipId) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center border rounded-xl bg-card">
        <h2 className="text-xl font-bold mb-4">No Membership Selected</h2>
        <p className="mb-6 text-zinc-500">Please select a member&apos;s membership to record a payment.</p>
        <Link href="/unpaid" className="text-brand-500 hover:underline">Go to Unpaid Members</Link>
      </div>
    );
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      member: true,
      allocations: true,
      plan: true
    }
  });

  if (!membership) {
    notFound();
  }

  const totalPaid = membership.allocations.reduce((s, a) => s + a.amount, 0);
  const balance = membership.fee - totalPaid;
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-border">
          <h3 className="font-medium text-lg mb-2">{membership.member.fullName} <span className="text-zinc-500 text-sm">({membership.member.memberId})</span></h3>
          <p className="text-sm">Membership: {membership.plan?.name || "Custom Plan"}</p>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border">
            <div>
              <p className="text-xs text-zinc-500">Total Fee</p>
              <p className="font-semibold">₹{membership.fee}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Amount Paid</p>
              <p className="font-semibold text-emerald-500">₹{totalPaid}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Outstanding Balance</p>
              <p className="font-bold text-rose-500">₹{balance}</p>
            </div>
          </div>
        </div>

        <form action={recordPayment} className="space-y-6">
          <input type="hidden" name="membershipId" value={membership.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">Payment Amount (₹) <span className="text-rose-500">*</span></label>
              <input 
                id="amount" 
                name="amount" 
                type="number"
                min="0.01"
                step="0.01"
                max={balance > 0 ? balance : undefined}
                defaultValue={balance > 0 ? balance : 0}
                required
                className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">Payment Date <span className="text-rose-500">*</span></label>
              <input 
                id="date" 
                name="date" 
                type="date"
                defaultValue={today}
                required
                className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="method" className="text-sm font-medium">Payment Method <span className="text-rose-500">*</span></label>
              <select 
                id="method" 
                name="method" 
                required
                className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="referenceNumber" className="text-sm font-medium">Reference Number (Optional)</label>
              <input 
                id="referenceNumber" 
                name="referenceNumber" 
                placeholder="Transaction ID / Receipt No"
                className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
              <textarea 
                id="notes" 
                name="notes" 
                rows={3}
                placeholder="Any additional details..."
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border gap-4">
            <Link 
              href={`/members/${membership.memberId}`}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={balance <= 0}
              className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
