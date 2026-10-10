"use client";

import { useState } from "react";
import { recordPayment } from "@/app/actions/payment";
import { CreditCard, X } from "lucide-react";

export default function RecordPaymentForm({ 
  membershipId, 
  memberId,
  balance 
}: { 
  membershipId: string;
  memberId: string;
  balance: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <button 
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 transition-colors"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsPending(true);
    // Let the form submit normally, it uses Server Actions
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="bg-muted/30 border border-border p-4 rounded-lg relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h4 className="font-semibold mb-4">Record New Payment</h4>
        <form action={recordPayment} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="memberId" value={memberId} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <input 
                type="number" name="amount" min="1" max={balance} step="0.01" defaultValue={balance} required
                className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Date</label>
              <input 
                type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required
                className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select 
                name="method" required
                className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference Number</label>
              <input 
                name="referenceNumber" placeholder="Optional"
                className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <input 
                name="notes" placeholder="Optional"
                className="w-full bg-background border border-border rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isPending}
              className="px-3 py-1.5 text-sm font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
