import React, { useMemo } from 'react';
import { Member } from '@/types';
import { Cake, Gift, MessageSquare, Phone } from 'lucide-react';

interface BirthdaysWidgetProps {
  members: Member[];
  onNavigateTab: (tab: string, deepLinkId?: string) => void;
  isLoading?: boolean;
}

export interface BirthdayItem {
  member: Member;
  birthdateStr: string;
  displayDate: string;
  daysAway: number;
  age?: number;
}

export const BirthdaysWidget: React.FC<BirthdaysWidgetProps> = ({
  members,
  onNavigateTab,
  isLoading,
}) => {
  // Calculate upcoming birthdays for the next 7 days (and current month)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const list: BirthdayItem[] = [];

    members.forEach((m) => {
      const bDayStr = m.birthdate || (m as any).dob;
      if (!bDayStr) return;

      try {
        const parts = bDayStr.split('-');
        if (parts.length < 2) return;

        let month = parseInt(parts[parts.length - 2], 10) - 1;
        let day = parseInt(parts[parts.length - 1], 10);
        let birthYear = parts.length === 3 && parts[0].length === 4 ? parseInt(parts[0], 10) : null;

        if (isNaN(month) || isNaN(day)) return;

        // Birthday in current year
        let bDayThisYear = new Date(currentYear, month, day);
        if (bDayThisYear < new Date(currentYear, today.getMonth(), today.getDate() - 1)) {
          bDayThisYear = new Date(currentYear + 1, month, day);
        }

        const diffTime = bDayThisYear.getTime() - new Date(currentYear, today.getMonth(), today.getDate()).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 7) {
          let age = birthYear ? currentYear - birthYear : undefined;
          list.push({
            member: m,
            birthdateStr: bDayStr,
            displayDate: bDayThisYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            daysAway: diffDays,
            age,
          });
        }
      } catch (e) {
        // Skip invalid date
      }
    });

    return list.sort((a, b) => a.daysAway - b.daysAway);
  }, [members]);

  // WhatsApp quick birthday message link generator
  const getWhatsAppBirthdayLink = (m: Member) => {
    const cleanPhone = (m.phone || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Dear ${m.firstName}, Wishing you a blessed Happy Birthday from your church family at ShepherdHub! May God fill your year with grace, joy, and peace. 🎂🎉`
    );
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-3">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            <span>Upcoming Birthdays & Important Dates</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Members celebrating birthdays in the next 7 days.
          </p>
        </div>
        <span className="text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/50 px-2.5 py-1 rounded-full border border-pink-200 dark:border-pink-900">
          {upcomingBirthdays.length} Upcoming
        </span>
      </div>

      {/* Birthday List */}
      {upcomingBirthdays.length > 0 ? (
        <div className="space-y-2.5">
          {upcomingBirthdays.map(({ member: m, displayDate, daysAway, age }) => (
            <div
              key={m.id}
              className="p-3 bg-pink-50/40 dark:bg-pink-950/20 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-2xl border border-pink-100 dark:border-pink-900/40 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold text-xs shrink-0 border border-pink-200 dark:border-pink-800">
                  {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {m.firstName} {m.lastName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {displayDate} • {daysAway === 0 ? <strong className="text-pink-600 dark:text-pink-400">Today! 🎉</strong> : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                    {age ? ` (${age} yrs)` : ''}
                  </p>
                </div>
              </div>

              {/* Quick Action Button: Send Birthday Message */}
              <a
                href={getWhatsAppBirthdayLink(m)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send Wish</span>
              </a>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
          <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">No birthdays in the next 7 days</h4>
          <p className="text-xs text-slate-400">
            Keep member dates of birth updated in the Member Directory.
          </p>
        </div>
      )}
    </div>
  );
};
