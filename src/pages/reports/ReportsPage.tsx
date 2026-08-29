import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  reportService,
  MembershipReportData,
  AttendanceReportData,
  VisitorReportData,
  MinistryReportData,
  GroupReportData,
  GivingReportData,
} from '@/services/reportService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BarChart3,
  Users,
  CalendarCheck2,
  UserCheck,
  Layers,
  Church as ChurchIcon,
  DollarSign,
  Download,
  Printer,
  Search,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

export function ReportsPage() {
  const { activeChurch, currentRole } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [activeTab, setActiveTab] = useState<'membership' | 'attendance' | 'visitors' | 'ministries' | 'groups' | 'giving'>('membership');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Report Datasets
  const [membershipData, setMembershipData] = useState<MembershipReportData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReportData | null>(null);
  const [visitorData, setVisitorData] = useState<VisitorReportData | null>(null);
  const [ministryData, setMinistryData] = useState<MinistryReportData | null>(null);
  const [groupData, setGroupData] = useState<GroupReportData | null>(null);
  const [givingData, setGivingData] = useState<GivingReportData | null>(null);

  const canViewGiving = ['super_admin', 'church_admin', 'pastor'].includes(currentRole || '');

  const loadAllReports = async () => {
    setIsLoading(true);
    try {
      const [mems, att, vis, mins, grps, giv] = await Promise.all([
        reportService.getMembershipReport(churchId),
        reportService.getAttendanceReport(churchId),
        reportService.getVisitorReport(churchId),
        reportService.getMinistryReport(churchId),
        reportService.getGroupReport(churchId),
        reportService.getGivingReport(churchId, currentRole),
      ]);
      setMembershipData(mems);
      setAttendanceData(att);
      setVisitorData(vis);
      setMinistryData(mins);
      setGroupData(grps);
      setGivingData(giv);
    } catch (e) {
      console.error('Error loading report analytics:', e);
      toast.error('Failed to load reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, [churchId, currentRole]);

  // Handle Export CSV
  const handleExportCsv = () => {
    switch (activeTab) {
      case 'membership':
        if (membershipData?.records) {
          reportService.exportToCsv('church_membership_report', membershipData.records);
          toast.success('Membership CSV report exported.');
        }
        break;
      case 'attendance':
        if (attendanceData?.records) {
          reportService.exportToCsv('church_attendance_report', attendanceData.records);
          toast.success('Attendance CSV report exported.');
        }
        break;
      case 'visitors':
        if (visitorData?.records) {
          reportService.exportToCsv('church_visitors_report', visitorData.records);
          toast.success('Visitors CSV report exported.');
        }
        break;
      case 'ministries':
        if (ministryData?.records) {
          reportService.exportToCsv('church_ministries_report', ministryData.records);
          toast.success('Ministries CSV report exported.');
        }
        break;
      case 'groups':
        if (groupData?.records) {
          reportService.exportToCsv('church_groups_report', groupData.records);
          toast.success('Groups CSV report exported.');
        }
        break;
      case 'giving':
        if (givingData?.records && canViewGiving) {
          reportService.exportToCsv('church_giving_audit_report', givingData.records);
          toast.success('Financial Giving CSV report exported.');
        } else {
          toast.error('You do not have permission to export giving reports.');
        }
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-sky-600" />
            Executive Reports & Congregation Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time analytics for membership growth, weekly attendance, guest retention, and ministry health.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={loadAllReports}
            className="h-9 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="h-9 gap-1.5 text-xs"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
          <TabsList className="h-9 bg-slate-100 dark:bg-slate-800 p-1 flex-wrap">
            <TabsTrigger value="membership" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Membership
            </TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="visitors" className="text-xs gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              Visitors
            </TabsTrigger>
            <TabsTrigger value="ministries" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Ministries
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs gap-1.5">
              <ChurchIcon className="h-3.5 w-3.5" />
              Small Groups
            </TabsTrigger>
            {canViewGiving && (
              <TabsTrigger value="giving" className="text-xs gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Giving & Finance
              </TabsTrigger>
            )}
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter report records..."
              className="pl-8 h-8 text-xs bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        {/* 1. MEMBERSHIP REPORT TAB */}
        <TabsContent value="membership" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/10">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Total Congregation</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {membershipData?.totalCount || 0}
                </p>
                <span className="text-[10px] text-slate-400">All registered profiles</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-600">Active Status</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {membershipData?.activeCount || 0}
                </p>
                <span className="text-[10px] text-slate-400">In good standing</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-purple-600">New Members (30d)</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  +{membershipData?.newThisMonth || 0}
                </p>
                <span className="text-[10px] text-slate-400">Recent covenants</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Demographic Breakdown</span>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>M: {membershipData?.maleCount || 0}</span>
                  <span>•</span>
                  <span>F: {membershipData?.femaleCount || 0}</span>
                </div>
                <span className="text-[10px] text-slate-400">Gender distribution</span>
              </CardContent>
            </Card>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Membership Roster Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3 pl-4">Member Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {membershipData?.records
                      .filter((r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100">{m.name}</td>
                          <td className="p-3 text-slate-500">{m.email}</td>
                          <td className="p-3 text-slate-500">{m.phone}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[9px]">{m.role}</Badge></td>
                          <td className="p-3"><Badge variant="emerald" className="text-[9px] capitalize">{m.status}</Badge></td>
                          <td className="p-3 pr-4 font-mono text-[11px] text-slate-500">{m.membershipDate}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ATTENDANCE REPORT TAB */}
        <TabsContent value="attendance" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-slate-500">Total Recorded Headcount</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {attendanceData?.totalHeadcount || 0}
                </p>
                <span className="text-[10px] text-slate-400">Sum across all sessions</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-600">Average Per Service</span>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {attendanceData?.averagePerService || 0}
                </p>
                <span className="text-[10px] text-slate-400">Average congregation size</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-sky-600">Logged Service Sessions</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {attendanceData?.totalSessions || 0}
                </p>
                <span className="text-[10px] text-slate-400">Weekly Sunday & prayer logs</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Service Attendance Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3 pl-4">Session Date</th>
                      <th className="p-3">Service / Event Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Headcount</th>
                      <th className="p-3 pr-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attendanceData?.records
                      .filter((r) => !searchTerm || r.serviceName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 pl-4 font-mono font-semibold text-slate-900 dark:text-slate-100">{a.date}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{a.serviceName}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[9px]">{a.type}</Badge></td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{a.headcount}</td>
                          <td className="p-3 pr-4 text-slate-500">{a.recordedBy}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. VISITOR REPORT TAB */}
        <TabsContent value="visitors" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-sky-600">Total Sunday Guests</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {visitorData?.totalVisitors || 0}
                </p>
                <span className="text-[10px] text-slate-400">First-time visitor cards</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-purple-600">New This Month</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  +{visitorData?.newThisMonth || 0}
                </p>
                <span className="text-[10px] text-slate-400">Recent guests</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-600">Follow-Ups Completed</span>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {visitorData?.followUpCompleted || 0}
                </p>
                <span className="text-[10px] text-slate-400">Pastoral contact made</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-amber-600">Conversion Rate</span>
                <p className="text-2xl font-black font-mono text-amber-600 mt-1">
                  {visitorData?.conversionRatePercent || 0}%
                </p>
                <span className="text-[10px] text-slate-400">Guest to member pipeline</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Visitor Follow-Up Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3 pl-4">Guest Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">First Visit Date</th>
                      <th className="p-3 pr-4">Follow-Up Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visitorData?.records
                      .filter((r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100">{v.name}</td>
                          <td className="p-3 text-slate-500">{v.email}</td>
                          <td className="p-3 text-slate-500">{v.phone}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500">{v.firstVisitDate}</td>
                          <td className="p-3 pr-4">
                            <Badge variant={v.followUpStatus === 'completed' ? 'emerald' : 'amber'} className="text-[9px] capitalize">
                              {v.followUpStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. MINISTRIES & GROUPS TAB */}
        <TabsContent value="ministries" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-slate-500">Active Ministries</span>
                <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                  {ministryData?.totalMinistries || 0}
                </p>
                <span className="text-[10px] text-slate-400">Departments & teams</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-purple-600">Total Ministry Members</span>
                <p className="text-2xl font-black font-mono text-purple-600 mt-1">
                  {ministryData?.totalMinistryMembers || 0}
                </p>
                <span className="text-[10px] text-slate-400">Serving congregation members</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-emerald-600">Active Volunteers</span>
                <p className="text-2xl font-black font-mono text-emerald-600 mt-1">
                  {ministryData?.totalVolunteers || 0}
                </p>
                <span className="text-[10px] text-slate-400">Scheduled roster volunteers</span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Ministry Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3 pl-4">Ministry Name</th>
                      <th className="p-3">Department Lead</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Members Count</th>
                      <th className="p-3 pr-4">Active Volunteers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ministryData?.records
                      .filter((r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100">{m.name}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{m.leadName}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[9px]">{m.category}</Badge></td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{m.membersCount}</td>
                          <td className="p-3 pr-4 font-mono text-emerald-600 font-bold">{m.volunteersCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. SMALL GROUPS TAB */}
        <TabsContent value="groups" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Small Groups & Discipleship Circles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-3 pl-4">Group Name</th>
                      <th className="p-3">Group Leader</th>
                      <th className="p-3">Meeting Schedule</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 pr-4">Members</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {groupData?.records
                      .filter((r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 pl-4 font-semibold text-slate-900 dark:text-slate-100">{g.name}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{g.leaderName}</td>
                          <td className="p-3 text-slate-500">{g.meetingDay}</td>
                          <td className="p-3"><Badge variant="outline" className="text-[9px]">{g.category}</Badge></td>
                          <td className="p-3 pr-4 font-mono font-bold text-amber-600">{g.membersCount}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. GIVING & FINANCE TAB (PROTECTED) */}
        {canViewGiving && (
          <TabsContent value="giving" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Giving Received YTD</span>
                  <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ${(givingData?.totalGiving || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">All registered fund contributions</span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monthly Run-Rate</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    ${(givingData?.monthlyAverage || 0).toLocaleString()}/mo
                  </p>
                  <span className="text-[10px] text-slate-400">Average per month</span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-sky-600">Active Financial Contributors</span>
                  <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                    {givingData?.donorCount || 0}
                  </p>
                  <span className="text-[10px] text-slate-400">Donors with recorded tithes</span>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Financial Contributions Audit Log</CardTitle>
                <CardDescription className="text-xs">Confidential executive finance report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-3 pl-4">Date</th>
                        <th className="p-3">Contributor</th>
                        <th className="p-3">Designated Fund</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Reference #</th>
                        <th className="p-3 pr-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {givingData?.records
                        .filter((r) => !searchTerm || r.donorName.toLowerCase().includes(searchTerm.toLowerCase()) || r.fundName.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 pl-4 font-mono text-slate-500 text-[11px]">{d.date}</td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{d.donorName}</td>
                            <td className="p-3"><Badge variant="outline" className="text-[9px]">{d.fundName}</Badge></td>
                            <td className="p-3 font-mono text-[10px] uppercase text-slate-500">{d.paymentMethod}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{d.refNumber}</td>
                            <td className="p-3 pr-4 text-right font-mono font-bold text-emerald-600">
                              ${d.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
export default ReportsPage;
