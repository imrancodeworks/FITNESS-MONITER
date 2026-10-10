import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { 
  updateGymSettings, 
  updateAdmissionFee, 
  updatePaymentSettings, 
  addMembershipPlan 
} from "@/app/actions/settings";
import { Save, Plus } from "lucide-react";
import EditablePlanRow from "@/components/EditablePlanRow";

export default async function SettingsPage() {
  await connection();
  
  const [settingsRaw, plans] = await Promise.all([
    prisma.setting.findMany(),
    prisma.membershipPlan.findMany({ orderBy: { durationMonths: 'asc' } })
  ]);
  
  const settings = settingsRaw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage gym configuration, admission fees, and memberships.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Section 1 & 4: Gym Information & Expiry */}
        <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-semibold">Gym Information</h2>
          </div>
          <form action={updateGymSettings} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gym Name</label>
              <input name="gymName" defaultValue={settings.gymName || "Fitness Monitoring"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input name="gymPhone" defaultValue={settings.gymPhone || ""} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input name="gymEmail" defaultValue={settings.gymEmail || ""} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <textarea name="gymAddress" defaultValue={settings.gymAddress || ""} className="w-full p-3 rounded-md border border-input bg-background text-sm resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency Symbol</label>
                <input name="currency" defaultValue={settings.currency || "₹"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Warning (Days)</label>
                <input type="number" name="expiryWarningDays" defaultValue={settings.expiryWarningDays || "7"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Receipt Footer Text</label>
              <input name="receiptFooter" defaultValue={settings.receiptFooter || "Thank you for choosing Fitness Monitoring!"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-500 text-white hover:bg-brand-600 h-10 px-4">
              <Save className="mr-2 h-4 w-4" /> Save Gym Info
            </button>
          </form>
        </section>

        <div className="space-y-8">
          {/* Section 2: Admission Fee */}
          <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold">Admission Fee</h2>
            </div>
            <form action={updateAdmissionFee} className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="admissionFeeEnabled" name="admissionFeeEnabled" value="true" defaultChecked={settings.admissionFeeEnabled === 'true'} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
                <label htmlFor="admissionFeeEnabled" className="text-sm font-medium">Enable one-time admission fee for new members</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fee Amount</label>
                <input type="number" step="0.01" name="admissionFeeAmount" defaultValue={settings.admissionFeeAmount || "500"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input name="admissionFeeDescription" defaultValue={settings.admissionFeeDescription || "Registration & ID Card"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-500 text-white hover:bg-brand-600 h-10 px-4">
                <Save className="mr-2 h-4 w-4" /> Save Admission Fee
              </button>
            </form>
          </section>

          {/* Section 5: Payment Configuration */}
          <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-xl font-semibold">Payment Methods</h2>
            </div>
            <form action={updatePaymentSettings} className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="cash" name="paymentMethodCash" value="true" defaultChecked={settings.paymentMethodCash !== 'false'} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
                  <label htmlFor="cash" className="text-sm font-medium">Cash</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="upi" name="paymentMethodUPI" value="true" defaultChecked={settings.paymentMethodUPI !== 'false'} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
                  <label htmlFor="upi" className="text-sm font-medium">UPI / QR Code</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="bank" name="paymentMethodBank" value="true" defaultChecked={settings.paymentMethodBank !== 'false'} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
                  <label htmlFor="bank" className="text-sm font-medium">Bank Transfer</label>
                </div>
              </div>
              <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-brand-500 text-white hover:bg-brand-600 h-10 px-4">
                <Save className="mr-2 h-4 w-4" /> Save Payment Methods
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Section 3: Membership Pricing & Duration */}
      <section className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Membership Pricing & Duration</h2>
        </div>
        
        <div className="p-6">
          <div className="rounded-md border mb-6">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plans.map((plan) => (
                  <EditablePlanRow key={plan.id} plan={plan} />
                ))}
              </tbody>
            </table>
          </div>

          <form action={addMembershipPlan} className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col md:flex-row items-end gap-4">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-xs font-medium">New Plan Name</label>
              <input name="name" required placeholder="e.g. Quarterly" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="space-y-2 w-full md:w-32">
              <label className="text-xs font-medium">Duration (Months)</label>
              <input type="number" name="durationMonths" required min="1" placeholder="3" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="space-y-2 w-full md:w-32">
              <label className="text-xs font-medium">Price</label>
              <input type="number" name="fee" required min="0" step="0.01" placeholder="2500" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <input type="hidden" name="isActive" value="true" />
            <button type="submit" className="w-full md:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-zinc-900 text-zinc-50 hover:bg-zinc-800 h-9 px-4">
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
