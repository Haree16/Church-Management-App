import React, { useState } from 'react';
import { 
  Users, Heart, Calendar, Bell, 
  Megaphone, HeartHandshake, UserCheck, Menu, X,
  GraduationCap, MessageSquare, Building2, Settings, Landmark,
  LayoutDashboard, BarChart3
} from 'lucide-react';
import { SaaSUserRole, ChurchModuleToggles } from '../types';
import { isTabAllowed, getRoleConfig, isModuleEnabledInChurch } from '../utils/rbac';

export type AppTab = 
  | 'dashboard'
  | 'reports'
  | 'directory' 
  | 'ministries'
  | 'attendance' 
  | 'prayers' 
  | 'calendar' 
  | 'notifications' 
  | 'announcements' 
  | 'volunteers' 
  | 'roster' 
  | 'sundayschool'
  | 'whatsapp'
  | 'saas'
  | 'settings';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  urgentPrayerCount: number;
  unreadNotifCount: number;
  userRole?: SaaSUserRole;
  moduleToggles?: ChurchModuleToggles;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  urgentPrayerCount,
  unreadNotifCount,
  userRole = 'PastorAdmin' as SaaSUserRole,
  moduleToggles,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const roleConfig = getRoleConfig(userRole);

  const ALL_MODULES = [
    { id: 'dashboard' as AppTab, label: 'Dashboard', icon: LayoutDashboard, desc: 'Church analytics & personalized overview' },
    { id: 'reports' as AppTab, label: 'Reports', icon: BarChart3, desc: 'Detailed reports, growth trends & exports' },
    { id: 'directory' as AppTab, label: 'Members', icon: Users, desc: 'Church member & family directory' },
    { id: 'ministries' as AppTab, label: 'Ministries', icon: Landmark, desc: 'Church ministries, teams & activities' },
    { id: 'prayers' as AppTab, label: 'Prayers', icon: Heart, desc: 'Intercessory prayer requests & praises', badge: urgentPrayerCount > 0 ? urgentPrayerCount : undefined },
    { id: 'calendar' as AppTab, label: 'Events', icon: Calendar, desc: 'Service calendar & event schedules' },
    { id: 'sundayschool' as AppTab, label: 'Sunday School', icon: GraduationCap, desc: 'Children classes, memory verses & badges' },
    { id: 'whatsapp' as AppTab, label: 'WhatsApp', icon: MessageSquare, desc: 'One-click WhatsApp reminders & notices' },
    { id: 'attendance' as AppTab, label: 'Attendance', icon: UserCheck, desc: 'Sunday service attendance tracking' },
    { id: 'announcements' as AppTab, label: 'Bulletins', icon: Megaphone, desc: 'Pastoral notes & church announcements' },
    { id: 'volunteers' as AppTab, label: 'Volunteers', icon: HeartHandshake, desc: 'Ministry teams & skill matching' },
    { id: 'roster' as AppTab, label: 'Roster', icon: Calendar, desc: 'Sunday service duty assignments' },
    { id: 'notifications' as AppTab, label: 'Alerts', icon: Bell, desc: 'Live church broadcast notifications', badge: unreadNotifCount > 0 ? unreadNotifCount : undefined },
    { id: 'saas' as AppTab, label: 'SaaS Console', icon: Building2, desc: 'Multi-tenant church switcher & user roles' },
    { id: 'settings' as AppTab, label: 'Settings', icon: Settings, desc: 'Church profile, services, ministries & preferences' },
  ];

  // Filter and order modules permitted for this role and active church module toggles
  const allowedModules = roleConfig.allowedTabs
    .filter((tabId) => isModuleEnabledInChurch(tabId, moduleToggles))
    .map((tabId) => ALL_MODULES.find((m) => m.id === tabId))
    .filter(Boolean) as typeof ALL_MODULES;

  // If role has <= 5 tabs, show them directly in the bottom bar!
  const hasMoreMenu = allowedModules.length > 5;
  const primaryTabs = hasMoreMenu ? allowedModules.slice(0, 4) : allowedModules;
  const overflowTabs = hasMoreMenu ? allowedModules.slice(4) : [];

  return (
    <>
      {/* Overflow Modules Drawer */}
      {showMoreMenu && hasMoreMenu && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-40 flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Menu className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-white">More Permitted Modules</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Filtered for role: <strong className="text-amber-300">{roleConfig.label}</strong>
                </p>
              </div>

              <button
                id="btn-close-more-menu"
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {overflowTabs.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    id={`btn-menu-${mod.id}`}
                    onClick={() => {
                      setActiveTab(mod.id);
                      setShowMoreMenu(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold leading-snug">{mod.label}</p>
                        {mod.badge !== undefined && (
                          <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            {mod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{mod.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="bg-slate-950 border-t border-slate-800/80 text-slate-400 sticky bottom-0 z-30 px-2 py-1.5 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`btn-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-amber-400 font-extrabold bg-amber-500/15'
                    : 'hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-medium">{tab.label}</span>
              </button>
            );
          })}

          {hasMoreMenu && (() => {
            const isOverflowActive = overflowTabs.some(t => t.id === activeTab);
            const activeOverflowMod = overflowTabs.find(t => t.id === activeTab);
            return (
              <button
                id="btn-open-more-menu"
                onClick={() => setShowMoreMenu(true)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all ${
                  isOverflowActive
                    ? 'text-amber-400 font-extrabold bg-amber-500/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Menu className={`w-5 h-5 ${isOverflowActive ? 'stroke-[2.5] text-amber-400' : 'stroke-2 text-amber-400'}`} />
                <span className="text-[10px] mt-1 tracking-tight font-bold text-amber-400 truncate max-w-[65px]">
                  {isOverflowActive ? activeOverflowMod?.label : `More (${overflowTabs.length})`}
                </span>
              </button>
            );
          })()}
        </div>
      </nav>
    </>
  );
};
