import { prisma } from "@/lib/prisma";
import { format, differenceInDays, addDays } from "date-fns";
import Link from "next/link";
import { AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { connection } from "next/server";

export default async function ExpiringSoonPage() {
  await connection();
  const now = new Date();
  
  // Read expiry warning days from settings
  const setting = await prisma.setting.findUnique({ where: { key: 'expiryWarningDays' } });
  const warningDays = setting ? parseInt(setting.value, 10) : 7;
  const warningDate = addDays(now, warningDays);

  const memberships = await prisma.membership.findMany({
    where: {
      endDate: {
        gte: now,
        lte: warningDate
      }
    },
    include: {
      member: true,
      plan: true,
      allocations: true,
    },
    orderBy: {
      endDate: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Expiring Memberships</h1>
        <div className="flex items-center text-amber-500 bg-amber-50 px-3 py-1 rounded-md text-sm font-medium">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Expiring within {warningDays} days
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Days Left</th>
              <th className="px-4 py-3 font-medium">Payment Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No memberships are expiring soon.
                </td>
              </tr>
            ) : (
              memberships.map((m) => {
                const daysRemaining = differenceInDays(m.endDate, now);
                const totalDue = m.fee + (m.admissionFee || 0) - (m.discount || 0);
                const totalPaid = m.allocations.reduce((sum, a) => sum + a.amount, 0);
                const balance = totalDue - totalPaid;
                
                let paymentStatus = "Unpaid";
                let statusColor = "text-rose-500 bg-rose-50";
                if (balance <= 0) {
                  paymentStatus = "Fully Paid";
                  statusColor = "text-emerald-500 bg-emerald-50";
                } else if (totalPaid > 0) {
                  paymentStatus = "Partially Paid";
                  statusColor = "text-amber-500 bg-amber-50";
                }

                return (
                  <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{m.member.fullName}</div>
                      <div className="text-xs text-muted-foreground">{m.member.memberId} &bull; {m.member.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.plan?.name || "Custom"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(m.startDate, 'MMM d, yyyy')} - <br/>
                      <span className="font-medium text-foreground">{format(m.endDate, 'MMM d, yyyy')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {paymentStatus}
                      </div>
                      {balance > 0 && (
                        <div className="text-xs font-semibold text-rose-500 mt-1">
                          Due: ₹{balance}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/members/${m.memberId}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-8 w-8 text-muted-foreground"
                          title="View Member"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/memberships/renew?memberId=${m.memberId}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-500 text-white hover:bg-brand-600 h-8 px-3"
                          title="Renew Membership"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Renew
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
