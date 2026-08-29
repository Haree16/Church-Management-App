import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from 'sonner';

// Layout & Guards
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleRoute } from '@/components/auth/RoleRoute';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';

// Dashboard & Main Pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ChurchSettingsPage } from '@/pages/settings/ChurchSettingsPage';

// People Module
import { MembersPage } from '@/pages/people/MembersPage';
import { MemberProfilePage } from '@/pages/people/MemberProfilePage';
import { FamiliesPage } from '@/pages/people/FamiliesPage';
import { VisitorsPage } from '@/pages/people/VisitorsPage';

// Church Module
import { MinistriesPage } from '@/pages/church/MinistriesPage';
import { GroupsPage } from '@/pages/church/GroupsPage';
import { VolunteersPage } from '@/pages/church/VolunteersPage';

// Engagement Module
import { AttendancePage } from '@/pages/engagement/AttendancePage';
import { EventsPage } from '@/pages/engagement/EventsPage';
import { CalendarPage } from '@/pages/engagement/CalendarPage';
import { PrayerRequestsPage } from '@/pages/engagement/PrayerRequestsPage';
import { FollowUpsPage } from '@/pages/engagement/FollowUpsPage';

// Finance Module
import { DonationsPage } from '@/pages/finance/DonationsPage';
import { FundsPage } from '@/pages/finance/FundsPage';
import { GivingReportsPage } from '@/pages/finance/GivingReportsPage';

// Communication Module
import { AnnouncementsPage } from '@/pages/communication/AnnouncementsPage';
import { NotificationsPage } from '@/pages/communication/NotificationsPage';
import { CommunicationComposerPage } from '@/pages/communication/CommunicationComposerPage';

// Next-Gen Ministry Modules (Phase 7)
import { ChildrenPage } from '@/pages/children/ChildrenPage';
import { ChildrenClassesPage } from '@/pages/children/ChildrenClassesPage';
import { YouthPage } from '@/pages/youth/YouthPage';

// Reports Module
import { ReportsPage } from '@/pages/reports/ReportsPage';

// Settings & Audit Module (Phase 8)
import { AuditLogsPage } from '@/pages/settings/AuditLogsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster richColors position="top-right" closeButton />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes inside Main App Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* People Routes */}
                <Route path="/people/members" element={<MembersPage />} />
                <Route path="/people/members/:id" element={<MemberProfilePage />} />
                <Route path="/people/families" element={<FamiliesPage />} />
                <Route path="/people/visitors" element={<VisitorsPage />} />

                {/* Church Routes */}
                <Route path="/church/ministries" element={<MinistriesPage />} />
                <Route path="/church/groups" element={<GroupsPage />} />
                <Route path="/church/volunteers" element={<VolunteersPage />} />

                {/* Engagement Routes */}
                <Route path="/engagement/attendance" element={<AttendancePage />} />
                <Route path="/engagement/events" element={<EventsPage />} />
                <Route path="/engagement/calendar" element={<CalendarPage />} />
                <Route path="/engagement/prayer-requests" element={<PrayerRequestsPage />} />
                <Route path="/engagement/follow-ups" element={<FollowUpsPage />} />

                {/* Finance Routes */}
                <Route path="/finance/donations" element={<DonationsPage />} />
                <Route path="/finance/funds" element={<FundsPage />} />
                <Route path="/finance/giving-reports" element={<GivingReportsPage />} />

                {/* Communication Routes */}
                <Route path="/communication/announcements" element={<AnnouncementsPage />} />
                <Route path="/communication/notifications" element={<NotificationsPage />} />
                <Route path="/communication/composer" element={<CommunicationComposerPage />} />

                {/* Children & Youth Ministry (Phase 7) */}
                <Route path="/children" element={<ChildrenPage />} />
                <Route path="/children/classes" element={<ChildrenClassesPage />} />
                <Route path="/youth" element={<YouthPage />} />

                {/* Reports Routes */}
                <Route path="/reports" element={<ReportsPage />} />

                {/* Settings Routes (Church Settings & Audit Logs) */}
                <Route path="/settings/church" element={<ChurchSettingsPage />} />
                <Route path="/settings/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
