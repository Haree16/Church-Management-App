import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck2, DollarSign, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenMobileMenu: () => void;
}

export function MobileBottomNav({ onOpenMobileMenu }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[11px] font-medium transition-colors',
            isActive
              ? 'text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          )
        }
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/people/members"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[11px] font-medium transition-colors',
            isActive
              ? 'text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          )
        }
      >
        <Users className="h-5 w-5" />
        <span>People</span>
      </NavLink>

      <NavLink
        to="/engagement/attendance"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[11px] font-medium transition-colors',
            isActive
              ? 'text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          )
        }
      >
        <CalendarCheck2 className="h-5 w-5" />
        <span>Attendance</span>
      </NavLink>

      <NavLink
        to="/finance/donations"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[11px] font-medium transition-colors',
            isActive
              ? 'text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          )
        }
      >
        <DollarSign className="h-5 w-5" />
        <span>Giving</span>
      </NavLink>

      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center gap-1 rounded-lg py-1 px-3 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <Menu className="h-5 w-5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
