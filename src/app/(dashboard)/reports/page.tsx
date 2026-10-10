import { prisma } from "@/lib/prisma";
import { Banknote, TrendingUp, AlertCircle, CreditCard } from "lucide-react";
import { connection } from "next/server";

export default async function ReportsPage() {
  await connection();
  
  const [memberships, payments] = await Promise.all([
    prisma.membership.findMany({
      include: { allocations: true }
    }),
    prisma.payment.findMany({
      where: { isReversed: false }
    })
  ]);

  let totalCharges = 0;
  let totalOutstanding = 0;
  
  memberships.forEach(m => {
    const totalDue = m.fee + (m.admissionFee || 0) - (m.discount || 0);
    const totalPaid = m.allocations.reduce((sum, a) => sum + a.amount, 0);
    totalCharges += totalDue;
    
    const balance = totalDue - totalPaid;
    if (balance > 0) {
      totalOutstanding += balance;
    }
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const paymentsByMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">Financial overview based on actual recorded payments.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-muted-foreground">Total Charges Raised</h3>
          </div>
          <div className="text-3xl font-bold mt-2">₹{totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-2">Sum of all membership fees and admission fees minus discounts.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Banknote className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-muted-foreground">Total Collected</h3>
          </div>
          <div className="text-3xl font-bold mt-2 text-emerald-600">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-2">Sum of all actual recorded payments.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-muted-foreground">Total Outstanding</h3>
          </div>
          <div className="text-3xl font-bold mt-2 text-rose-600">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground mt-2">Total unpaid balances across all active and expired memberships.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mt-8">
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 border-b border-border flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-brand-500" />
          <h3 className="font-semibold text-lg">Collections by Payment Method</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-zinc-500 uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Amount Collected</th>
                <th className="px-6 py-4 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.keys(paymentsByMethod).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-zinc-500 text-center">No payments recorded yet.</td>
                </tr>
              ) : Object.entries(paymentsByMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                <tr key={method} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{method}</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {totalCollected > 0 ? ((amount / totalCollected) * 100).toFixed(1) : "0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
