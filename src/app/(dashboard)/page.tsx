import { prisma } from "@/lib/prisma";
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Banknote,
  TrendingUp,
  Plus,
  Clock,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { addDays } from "date-fns";
import { connection } from "next/server";

export default async function DashboardPage() {
  await connection();
  const now = new Date();
  
  // Read expiry warning days from settings (fallback to 7)
  const setting = await prisma.setting.findUnique({ where: { key: 'expiryWarningDays' } });
  const warningDays = setting ? parseInt(setting.value, 10) : 7; 
  const warningDate = addDays(now, warningDays);

  const [
    totalMembers,
    memberships,
    totalPayments
  ] = await Promise.all([
    prisma.member.count({ where: { isArchived: false } }),
    prisma.membership.findMany({
      include: {
        allocations: true,
      }
    }),
    prisma.payment.aggregate({
      where: { isReversed: false },
      _sum: { amount: true }
    })
  ]);

  // Membership Status Counts
  let activeCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;
  let notStartedCount = 0;
  
  // Payment Status Counts
  let fullyPaidCount = 0;
  let partiallyPaidCount = 0;
  let unpaidCount = 0;
  
  let outstandingPaymentsTotal = 0;

  memberships.forEach(m => {
    // 1. Evaluate Membership Status
    if (m.startDate > now) {
      notStartedCount++;
    } else if (m.endDate < now) {
      expiredCount++;
    } else if (m.endDate <= warningDate) {
      expiringSoonCount++;
    } else {
      activeCount++;
    }

    // 2. Evaluate Payment Status
    const totalDue = m.fee + (m.admissionFee || 0) - (m.discount || 0);
    const totalPaid = m.allocations.reduce((sum, a) => sum + a.amount, 0);
    const balance = totalDue - totalPaid;

    if (balance > 0) {
      outstandingPaymentsTotal += balance;
    }

    if (balance <= 0) {
      fullyPaidCount++;
    } else if (totalPaid > 0) {
      partiallyPaidCount++;
    } else {
      unpaidCount++;
    }
  });

  const mainStats = [
    { name: "Total Members", value: totalMembers, icon: Users, color: "text-blue-500", href: "/members" },
    { name: "Active Memberships", value: activeCount + expiringSoonCount, icon: UserCheck, color: "text-brand-500", href: "/members" },
    { name: "Expiring Soon", value: expiringSoonCount, icon: AlertTriangle, color: "text-amber-500", href: "/expiring-soon" },
    { name: "Expired Memberships", value: expiredCount, icon: XCircle, color: "text-zinc-500", href: "/members" },
    { name: "Outstanding Payments", value: `₹${outstandingPaymentsTotal}`, icon: AlertCircle, color: "text-rose-500", href: "/unpaid" },
    { name: "Total Collections", value: `₹${totalPayments._sum.amount || 0}`, icon: Banknote, color: "text-emerald-500", href: "/reports" },
  ];

  const paymentStats = [
    { name: "Fully Paid", value: fullyPaidCount, icon: CheckCircle2, color: "text-emerald-500", href: "/members" },
    { name: "Partially Paid", value: partiallyPaidCount, icon: Clock, color: "text-amber-500", href: "/partially-paid" },
    { name: "Unpaid", value: unpaidCount, icon: AlertCircle, color: "text-rose-500", href: "/unpaid" },
  ];

  const membershipStats = [
    { name: "Active", value: activeCount, icon: Calendar, color: "text-brand-500", href: "/members" },
    { name: "Expiring Soon", value: expiringSoonCount, icon: AlertTriangle, color: "text-amber-500", href: "/expiring-soon" },
    { name: "Expired", value: expiredCount, icon: XCircle, color: "text-zinc-500", href: "/members" },
    { name: "Not Yet Started", value: notStartedCount, icon: Clock, color: "text-blue-500", href: "/members" },
  ];

  const renderCards = (stats: Array<{ name: string; value: number | string; icon: React.ElementType; color: string; href: string }>) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <Link key={stat.name} href={stat.href} className="block group">
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-brand-500/50">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{stat.name}</h3>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <Link 
          href="/members/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-brand-500 text-white hover:bg-brand-600 h-10 py-2 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        {renderCards(mainStats)}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
        {renderCards(paymentStats)}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Membership Status</h2>
        {renderCards(membershipStats)}
      </section>
    </div>
  );
}
