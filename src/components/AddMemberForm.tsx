"use client";

import { useState, useMemo } from "react";
import { createMember } from "@/app/actions/member";
import { format } from "date-fns";

type Plan = { id: string; name: string; fee: number; durationMonths: number | null };

export default function AddMemberForm({
  plans,
  nextMemberId,
  admissionFeeEnabled,
  admissionFeeAmount,
}: {
  plans: Plan[];
  nextMemberId: string;
  admissionFeeEnabled: boolean;
  admissionFeeAmount: number;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number | "">("");

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [selectedPlanId, plans]);
  
  const planFee = selectedPlan ? selectedPlan.fee : 0;
  const admissionFee = admissionFeeEnabled ? admissionFeeAmount : 0;
  const totalDue = planFee + admissionFee - discount;
  const balance = totalDue - (typeof amountPaid === 'number' ? amountPaid : 0);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <form action={createMember} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="memberId" className="text-sm font-medium">Member ID</label>
          <input 
            id="memberId" name="memberId" defaultValue={nextMemberId} required
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium">Full Name <span className="text-rose-500">*</span></label>
          <input 
            id="fullName" name="fullName" required placeholder="John Doe"
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number <span className="text-rose-500">*</span></label>
          <input 
            id="phoneNumber" name="phoneNumber" type="tel" required placeholder="9876543210"
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="emailAddress" className="text-sm font-medium">Email Address</label>
          <input 
            id="emailAddress" name="emailAddress" type="email" placeholder="john@example.com"
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label htmlFor="address" className="text-sm font-medium">Address</label>
          <input 
            id="address" name="address" placeholder="123 Gym Street"
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <hr className="border-border my-2" />
          <h3 className="text-lg font-semibold mt-4 mb-2">Membership Details</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="planId" className="text-sm font-medium">Membership Plan <span className="text-rose-500">*</span></label>
          <select 
            id="planId" name="planId" required
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          >
            <option value="">Select a plan</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.durationMonths}m) - ₹{plan.fee}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">Start Date <span className="text-rose-500">*</span></label>
          <input 
            id="startDate" name="startDate" type="date" defaultValue={today} required
            className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-muted/50 p-4 rounded-md border border-border space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Membership Fee</span>
              <span className="font-medium">₹{planFee}</span>
              <input type="hidden" name="membershipFee" value={planFee} />
            </div>
            {admissionFeeEnabled && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Admission Fee (One-time)</span>
                <span className="font-medium">₹{admissionFeeAmount}</span>
                <input type="hidden" name="admissionFee" value={admissionFeeAmount} />
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Discount</span>
              <div className="flex items-center">
                <span className="mr-2">₹</span>
                <input 
                  type="number" name="discount" min="0" max={planFee + admissionFee}
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

        <div className="col-span-1 md:col-span-2">
          <hr className="border-border my-2" />
          <h3 className="text-lg font-semibold mt-4 mb-2">Payment</h3>
        </div>

        <div className="space-y-2">
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
        <button type="button" className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-zinc-100 transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors">
          Register Member
        </button>
      </div>
    </form>
  );
}
