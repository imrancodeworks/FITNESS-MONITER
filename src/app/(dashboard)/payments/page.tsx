import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { connection } from "next/server";

export default async function PaymentsPage() {
  await connection();
  
  const payments = await prisma.payment.findMany({
    where: { isReversed: false },
    orderBy: { date: 'desc' },
    include: {
      member: true,
      recordedBy: true
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground mt-1">A comprehensive log of all payments collected.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 border-b border-border text-zinc-500 uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Receipt No.</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-zinc-500 text-center">No payments recorded in the system.</td>
                </tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">{format(p.date, 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 font-mono text-xs">{p.id.split('-')[0].toUpperCase()}</td>
                  <td className="px-6 py-4">
                    <Link href={`/members/${p.member.id}`} className="font-medium hover:underline">
                      {p.member.fullName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.member.memberId}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">₹{p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                      {p.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{p.recordedBy?.name || "System"}</td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`/api/receipts/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-border hover:bg-zinc-100 transition-colors h-8 px-3"
                    >
                      Download Receipt
                    </a>
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
