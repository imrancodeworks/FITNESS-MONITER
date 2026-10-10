import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { User, Calendar, CreditCard, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import RecordPaymentForm from "@/components/RecordPaymentForm";

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
  // Need to await params in Next.js 15
  const memberId = (await params).id;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberships: {
        orderBy: { startDate: 'desc' },
        include: {
          plan: true,
          allocations: {
            include: { payment: true }
          }
        }
      },
      payments: {
        orderBy: { date: 'desc' },
        include: { recordedBy: true }
      }
    }
  });

  if (!member) {
    notFound();
  }

  const currentMembership = member.memberships[0];
  const membershipHistory = member.memberships.slice(1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
        <div className="space-x-3">
          <Link 
            href={`/members/${member.id}/edit`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 h-9 px-4 transition-colors"
          >
            Edit Member
          </Link>
          <Link 
            href={`/memberships/renew?memberId=${member.id}`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 h-9 px-4 transition-colors"
          >
            Renew Membership
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{member.fullName}</h2>
                <p className="text-sm text-zinc-500">{member.memberId}</p>
              </div>
            </div>
            
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-zinc-500 font-medium">Phone Number</dt>
                <dd className="font-medium mt-1">{member.phoneNumber}</dd>
              </div>
              {member.emailAddress && (
                <div>
                  <dt className="text-zinc-500 font-medium">Email Address</dt>
                  <dd className="font-medium mt-1">{member.emailAddress}</dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-500 font-medium">Joined</dt>
                <dd className="font-medium mt-1">{format(member.createdAt, 'dd MMM yyyy')}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Memberships & Payments */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Current Membership */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 border-b border-border flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-lg">Current Membership</h3>
            </div>
            {currentMembership ? (() => {
              const totalPaid = currentMembership.allocations.reduce((s, a) => s + a.amount, 0);
              const balance = currentMembership.fee - totalPaid;
              const isPaid = balance <= 0;

              return (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-zinc-500 font-medium">Plan</p>
                      <p className="font-medium mt-1">{currentMembership.plan?.name || "Custom"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 font-medium">Validity</p>
                      <p className="font-medium mt-1">
                        {format(currentMembership.startDate, 'dd MMM yy')} to {format(currentMembership.endDate, 'dd MMM yy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 font-medium">Fee</p>
                      <p className="font-medium mt-1">₹{currentMembership.fee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500 font-medium">Payment Status</p>
                      <p className="font-medium mt-1">
                        {isPaid ? (
                          <span className="text-emerald-500 inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Paid (₹{totalPaid})</span>
                        ) : (
                          <span className="text-rose-500 inline-flex items-center gap-1"><AlertCircle className="h-4 w-4"/> Balance ₹{balance}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isPaid && (
                    <RecordPaymentForm 
                      membershipId={currentMembership.id}
                      memberId={member.id}
                      balance={balance}
                    />
                  )}
                </div>
              );
            })() : (
              <div className="p-6 text-zinc-500 text-sm">No active membership found.</div>
            )}
          </div>

          {/* Payment History */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 border-b border-border flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-lg">Payment History</h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-background border-b border-border text-zinc-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                    <th className="px-6 py-3 font-medium">Recorded By</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {member.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-zinc-500 text-center">No payments recorded.</td>
                    </tr>
                  ) : member.payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-3">{format(p.date, 'dd MMM yyyy')}</td>
                      <td className="px-6 py-3 font-medium text-emerald-500">₹{p.amount}</td>
                      <td className="px-6 py-3">{p.method}</td>
                      <td className="px-6 py-3">{p.recordedBy?.name || "System"}</td>
                      <td className="px-6 py-3 text-right">
                        <a 
                          href={`/api/receipts/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-border hover:bg-zinc-100 transition-colors h-7 px-3"
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
          
          {/* Membership History */}
          {membershipHistory.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4 border-b border-border flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-500" />
                <h3 className="font-semibold text-lg">Past Memberships</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-background border-b border-border text-zinc-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Dates</th>
                      <th className="px-6 py-3 font-medium text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {membershipHistory.map(mh => (
                      <tr key={mh.id}>
                        <td className="px-6 py-3">{mh.plan?.name || "Custom"}</td>
                        <td className="px-6 py-3 text-zinc-500">{format(mh.startDate, 'dd MMM yy')} - {format(mh.endDate, 'dd MMM yy')}</td>
                        <td className="px-6 py-3 text-right">₹{mh.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
