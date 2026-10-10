"use client";

import { useState } from "react";
import { checkIn, checkOut } from "@/app/actions/attendance";
import { format } from "date-fns";
import { LogIn, LogOut } from "lucide-react";

type AttendanceButtonProps = {
  memberId: string;
  activeAttendance: { id: string; checkIn: Date } | null;
  lastAttendance: { checkIn: Date; checkOut: Date | null } | null;
};

export default function AttendanceButton({ memberId, activeAttendance, lastAttendance }: AttendanceButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleAction = async () => {
    setIsPending(true);
    try {
      if (activeAttendance) {
        await checkOut(activeAttendance.id);
      } else {
        await checkIn(memberId);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (activeAttendance) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleAction}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 h-8 px-3 transition-colors disabled:opacity-50"
        >
          <LogOut className="mr-1 h-3 w-3" />
          {isPending ? "Processing..." : "Check Out"}
        </button>
        <span className="text-[10px] text-muted-foreground">
          In since {format(activeAttendance.checkIn, "hh:mm a")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleAction}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 h-8 px-3 transition-colors disabled:opacity-50"
      >
        <LogIn className="mr-1 h-3 w-3" />
        {isPending ? "Processing..." : "Check In"}
      </button>
      {lastAttendance && lastAttendance.checkOut && (
        <span className="text-[10px] text-muted-foreground">
          Last out {format(lastAttendance.checkOut, "hh:mm a")}
        </span>
      )}
    </div>
  );
}
