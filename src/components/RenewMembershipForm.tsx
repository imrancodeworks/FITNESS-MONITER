"use client";

import { useState, useMemo } from "react";
import { renewMembership } from "@/app/actions/membership";
import { format, addDays } from "date-fns";
import Link from "next/link";

type Plan = { id: string; name: string; fee: number; durationMonths: number | null };
type Membership = { endDate: Date; planId: string | null };

export default function RenewMembershipForm({
  member,
  plans,
}: {
  member: { id: string; fullName: string; memberId: string; memberships: Membership[] };
  plans: Plan[];
}) {
  const currentMembership = member.memberships[0];
  const [selectedPlanId, setSelectedPlanId] = useState(currentMembership?.planId || "");
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number | "">("");

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [selectedPlanId, plans]);
  
  const planFee = selectedPlan ? selectedPlan.fee : 0;
  const totalDue = planFee - discount;
  const balance = totalDue - (typeof amountPaid === 'number' ? amountPaid : 0);

  const today = format(new Date(), 'yyyy-MM-dd');
  let nextDayAfterCurrent = today;
  if (currentMembership) {
    nextDayAfterCurrent = format(addDays(new Date(currentMembership.endDate), 1), 'yyyy-MM-dd');
  }

  return (
    <form action={renewMembership} className="space-y-6">
      <input type="hidden" name="memberId" value={member.id} />
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="planId" className="text-sm font-medium">Select New Plan <span className="text-rose-500">*</span></label>
          <select 
            id="planId" name="planId" required
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          >
            <option value="">Select a plan</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ₹{plan.fee}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <label className="text-sm font-medium">Renewal Start Date</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <input type="radio" name="renewalOption" value="immediate" defaultChecked={!currentMembership} className="text-brand-500 focus:ring-brand-500" />
              <div>
                <p className="font-medium text-sm">Immediate Renewal</p>
                <p className="text-xs text-zinc-500">Starts today ({format(new Date(), 'dd MMM yyyy')})</p>
              </div>
            </label>
            
            {currentMembership && (
              <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <input type="radio" name="renewalOption" value="after-current" defaultChecked className="text-brand-500 focus:ring-brand-500" />
                <div>
                  <p className="font-medium text-sm">After Current Expiry</p>
                  <p className="text-xs text-zinc-500">Starts on {format(addDays(new Date(currentMembership.endDate), 1), 'dd MMM yyyy')}</p>
                </div>
              </label>
            )}
            
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <input type="radio" name="renewalOption" value="custom" className="text-brand-500 focus:ring-brand-500" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Custom Date</p>
                </div>
                <input 
                  type="date" name="customStartDate" defaultValue={nextDayAfterCurrent}
                  className="bg-background border border-border rounded-md h-8 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-muted/50 p-4 rounded-md border border-border space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Membership Fee</span>
              <span className="font-medium">₹{planFee}</span>
              <input type="hidden" name="membershipFee" value={planFee} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center">
                <span className="mr-2">₹</span>
                <input 
                  type="number" name="discount" min="0" max={planFee}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-background border border-border rounded-md h-8 px-2 text-right focus:outline-none focus:ring-1 focus:ring-brand-500" 
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-base">
              <span>Total Amount Due</span>
              <span>₹{Math.max(0, totalDue)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <label htmlFor="amountPaid" className="text-sm font-medium">Amount Paid Now (₹)</label>
          <input 
            id="amountPaid" name="amountPaid" type="number" min="0" max={totalDue} step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value ? parseFloat(e.target.value) : "")}
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
          <select 
            id="paymentMethod" name="paymentMethod"
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK">Bank Transfer</option>
          </select>
        </div>
        <div className="col-span-1 md:col-span-2 flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-md">
          <span className="font-medium text-zinc-700">Calculated Outstanding Balance:</span>
          <span className={`font-bold text-lg ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            ₹{Math.max(0, balance)}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border gap-4">
        <Link href={`/members/${member.memberId}`} className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          Cancel
        </Link>
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors">
          Confirm Renewal
        </button>
      </div>
    </form>
  );
}
