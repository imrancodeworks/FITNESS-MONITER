import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { connection } from "next/server";
import AttendanceButton from "@/components/AttendanceButton";

export default async function AllMembersPage() {
  await connection();
  const members = await prisma.member.findMany({
    where: { isArchived: false },
    include: {
      memberships: {
        orderBy: { startDate: 'desc' },
        take: 1,
        include: {
          plan: true,
          allocations: true
        }
      },
      attendances: {
        where: { date: format(new Date(), 'yyyy-MM-dd') },
        orderBy: { checkIn: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">All Members</h1>
        <Link 
          href="/members/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 h-10 py-2 px-4 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Member
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search members..."
              className="w-full bg-background border border-border rounded-md h-9 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {/* Filters can go here */}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Member ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No members found.
                  </td>
                </tr>
              ) : members.map((member) => {
                const currentMembership = member.memberships[0];
                let status = "No Plan";
                let paymentStatus = "-";
                let statusColor = "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
                let paymentColor = "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

                if (currentMembership) {
                  const now = new Date();
                  if (currentMembership.endDate < now) {
                    status = "Expired";
                    statusColor = "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
                  } else if (currentMembership.startDate > now) {
                    status = "Upcoming";
                    statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                  } else {
                    status = "Active";
                    statusColor = "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400";
                  }

                  const totalPaid = currentMembership.allocations.reduce((sum, a) => sum + a.amount, 0);
                  const balance = currentMembership.fee - totalPaid;

                  if (balance <= 0) {
                    paymentStatus = "Paid";
                    paymentColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
                  } else if (totalPaid > 0) {
                    paymentStatus = "Partially Paid";
                    paymentColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
                  } else {
                    paymentStatus = "Unpaid";
                    paymentColor = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
                  }
                }

                return (
                  <tr key={member.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{member.memberId}</td>
                    <td className="px-4 py-3">{member.fullName}</td>
                    <td className="px-4 py-3">{member.phoneNumber}</td>
                    <td className="px-4 py-3">{currentMembership?.plan?.name || "None"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${paymentColor}`}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceButton 
                        memberId={member.id} 
                        activeAttendance={member.attendances.find(a => !a.checkOut) || null}
                        lastAttendance={member.attendances[0] || null}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/members/${member.id}`}
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
        <div className="p-4 border-t border-border text-xs text-zinc-500">
          Showing {members.length} member(s)
        </div>
      </div>
    </div>
  );
}
