"use client";

import { useState } from "react";
import { editMembershipPlan, toggleMembershipPlan } from "@/app/actions/settings";
import { ToggleLeft, ToggleRight, Edit2, Save, X } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  durationMonths: number | null;
  fee: number;
  isActive: boolean;
};

export default function EditablePlanRow({ plan }: { plan: Plan }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!isEditing) {
    return (
      <tr className={!plan.isActive ? "bg-muted/30 opacity-75" : ""}>
        <td className="px-4 py-3 font-medium">{plan.name}</td>
        <td className="px-4 py-3">{plan.durationMonths} months</td>
        <td className="px-4 py-3">₹{plan.fee}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'}`}>
            {plan.isActive ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td className="px-4 py-3 text-right space-x-2">
          <button 
            type="button" 
            onClick={() => setIsEditing(true)} 
            className="inline-flex items-center text-muted-foreground hover:text-brand-500"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <form action={toggleMembershipPlan.bind(null, plan.id, !plan.isActive)} className="inline-block">
            <button type="submit" className="text-muted-foreground hover:text-brand-500 ml-2 align-middle">
              {plan.isActive ? <ToggleRight className="h-6 w-6 text-brand-500" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </form>
        </td>
      </tr>
    );
  }

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsPending(true);
  };

  return (
    <tr className="bg-muted/10 border-l-2 border-l-brand-500">
      <td colSpan={5} className="p-0">
        <form action={editMembershipPlan} onSubmit={handleEdit} className="flex items-center w-full px-4 py-2 gap-4">
          <input type="hidden" name="id" value={plan.id} />
          
          <div className="flex-1">
            <input 
              name="name" 
              defaultValue={plan.name} 
              required 
              className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm" 
            />
          </div>
          
          <div className="w-24">
            <div className="relative">
              <input 
                type="number" 
                name="durationMonths" 
                defaultValue={plan.durationMonths || 1} 
                required min="1" 
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm" 
              />
            </div>
          </div>
          
          <div className="w-24">
            <input 
              type="number" 
              name="fee" 
              defaultValue={plan.fee} 
              required min="0" step="0.01" 
              className="w-full h-8 px-2 rounded-md border border-input bg-background text-sm" 
            />
          </div>
          
          <div className="w-20 text-xs text-muted-foreground pt-1">
            (Editing will preserve history)
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              type="submit" 
              disabled={isPending}
              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Save className="h-4 w-4" />
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
