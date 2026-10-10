"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, UserPlus, AlertCircle, Clock, 
  AlertTriangle, CreditCard, BarChart3, Download, Settings, LogOut, 
  Dumbbell, Menu, X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";

const navigation = [
  { name: "MAIN", type: "header" },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "All Members", href: "/members", icon: Users },
  { name: "Add Member", href: "/members/new", icon: UserPlus },
  { name: "Expiring Members", href: "/expiring-soon", icon: AlertTriangle },
  
  { name: "PAYMENTS", type: "header" },
  { name: "Unpaid Members", href: "/unpaid", icon: AlertCircle },
  { name: "Partially Paid", href: "/partially-paid", icon: Clock },
  { name: "Payment History", href: "/payments", icon: CreditCard },
  { name: "Receipts", href: "/receipts", icon: Download },
  
  { name: "BUSINESS", type: "header" },
  { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
  
  { name: "CONFIGURATION", type: "header" },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);



  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/10">
        <Dumbbell className="h-6 w-6 text-brand-500 mr-2" />
        <span className="text-lg font-bold tracking-tight">Fitness Monitoring</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => {
          if (item.type === "header") {
            return (
              <div key={`header-${index}`} className="pt-6 pb-2 px-2 text-xs font-semibold text-zinc-400 tracking-wider">
                {item.name}
              </div>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon!;
          
          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-brand-500" : "text-zinc-400 group-hover:text-zinc-300"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border/10 shrink-0">
        <form action={logout}>
          <button type="submit" className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-400/10 transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between h-16 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] px-4 sticky top-0 z-40 border-b border-border/10">
        <div className="flex items-center">
          <Dumbbell className="h-6 w-6 text-brand-500 mr-2" />
          <span className="text-lg font-bold tracking-tight">Fitness Monitoring</span>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/80 transition-opacity" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 flex w-72 max-w-[calc(100%-3rem)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] shadow-xl flex-col">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[var(--color-sidebar)] text-[var(--color-sidebar-foreground)] border-r border-border/10">
        {sidebarContent}
      </div>
    </>
  );
}
