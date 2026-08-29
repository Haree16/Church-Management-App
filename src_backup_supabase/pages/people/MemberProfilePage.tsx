import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { memberService } from '@/services/memberService';
import {
  ChurchMember,
  AttendanceRecord,
  Donation,
  PrayerRequest,
  FollowUp,
  MemberStatus,
} from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { MemberFormDialog } from '@/components/people/MemberFormDialog';
import { PrayerFormDialog } from '@/components/prayer/PrayerFormDialog';
import { FollowUpFormDialog } from '@/components/followups/FollowUpFormDialog';
import { DonationFormDialog } from '@/components/finance/DonationFormDialog';
import { GivingStatementModal } from '@/components/finance/GivingStatementModal';
import { prayerService, CreatePrayerPayload } from '@/services/prayerService';
import { followUpService, CreateFollowUpPayload } from '@/services/followUpService';
import { financeService, CreateDonationPayload } from '@/services/financeService';
import { DonationFund } from '@/types/database';
import { CanAccess } from '@/components/ui/can-access';
import { getInitials, formatDate, formatCurrency } from '@/lib/utils';
import { ROLE_DEFINITIONS } from '@/lib/permissions';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Layers,
  Church as ChurchIcon,
  DollarSign,
  CalendarCheck2,
  MessageSquare,
  Sparkles,
  FileText,
  UserCheck,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { activeChurch, currentRole, user } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState<ChurchMember | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [funds, setFunds] = useState<DonationFund[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrayerDialogOpen, setIsPrayerDialogOpen] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);

  // New Note state
  const [newNote, setNewNote] = useState('');

  const loadMemberData = async () => {
    if (!activeChurch || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, fundList] = await Promise.all([
        memberService.getMemberById(activeChurch.id, id),
        financeService.getFunds(activeChurch.id, true),
      ]);
      setFunds(fundList);
      if (!data.member) {
        setError('Member profile not found');
      } else {
        setMember(data.member);
        setAttendance(data.attendance);
        setDonations(data.donations);
        setPrayerRequests(data.prayerRequests);
        setFollowUps(data.followUps);
      }
    } catch (err: any) {
      console.error('Failed to load member profile:', err);
      setError(err.message || 'Failed to load member data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData();
  }, [activeChurch, id]);

  const handleUpdateMember = async (payload: any) => {
    if (!activeChurch || !member) return;
    const updated = await memberService.updateMember(activeChurch.id, member.id, payload);
    setMember(updated);
    toast.success('Member profile updated successfully!');
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = member?.notes ? `${member.notes}\n• [${new Date().toLocaleDateString()}]: ${newNote}` : `• [${new Date().toLocaleDateString()}]: ${newNote}`;
    handleUpdateMember({ notes: updatedNotes });
    setNewNote('');
    toast.success('Care note appended to profile.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/people/members')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Members
        </Button>
        <ErrorState message={error || 'Member not found'} onRetry={loadMemberData} />
      </div>
    );
  }

  const profile = member.profile;
  const roleDef = ROLE_DEFINITIONS[member.role];
  const displayName = profile?.display_name || `${profile?.first_name} ${profile?.last_name}`;

  const totalGiving = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const attendanceCount = attendance.length;

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/people/members')}
          className="h-8 gap-1.5 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Button>

        <div className="flex items-center gap-2">
          <CanAccess permission="members:update">
            <Button
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="h-8 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </CanAccess>
        </div>
      </div>

      {/* Member Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 ring-4 ring-sky-50 dark:ring-sky-950">
              <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
              <AvatarFallback className="text-xl">{getInitials(displayName, profile?.email)}</AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {displayName}
                </h1>
                <Badge variant={roleDef?.badgeVariant || 'default'}>
                  {roleDef?.name || member.role}
                </Badge>
                <Badge variant="emerald" className="capitalize">
                  {member.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  ID: {member.membership_number}
                </span>
                <span>•</span>
                <span>{profile?.occupation || 'Covenant Member'}</span>
                <span>•</span>
                <span>Joined {formatDate(member.joined_date || member.membership_date)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-300">
                {profile?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.city}, {profile.state || 'TX'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Recorded Attendance</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {attendanceCount}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">services logged</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">YTD Contributions</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatCurrency(totalGiving)}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Ministry Assignment</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {member.ministry?.name || 'Unassigned'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Small Group</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {member.group?.name || 'No Group'}
          </p>
        </Card>
      </div>

      {/* 10 Professional Profile Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="h-10 flex-wrap justify-start bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="family" className="text-xs">Family</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          <TabsTrigger value="ministries" className="text-xs">Ministries</TabsTrigger>
          <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
          <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
          <TabsTrigger value="giving" className="text-xs">Giving</TabsTrigger>
          <TabsTrigger value="prayers" className="text-xs">Prayer Requests</TabsTrigger>
          <TabsTrigger value="followups" className="text-xs">Follow-ups</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-sky-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-medium capitalize">{profile?.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-medium">{formatDate(profile?.dob)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Marital Status:</span>
                  <span className="font-medium capitalize">{profile?.marital_status || 'Single'}</span>
                </div>
                {profile?.marriage_date && (
                  <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                    <span className="text-slate-500">Wedding Anniversary:</span>
                    <span className="font-medium">{formatDate(profile.marriage_date)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Occupation:</span>
                  <span className="font-medium">{profile?.occupation || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-right">{profile?.address || 'N/A'}, {profile?.city || ''}</span>
                </div>
              </CardContent>
            </Card>

            {/* Spiritual Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Spiritual Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Salvation Date:</span>
                  <span className="font-medium">{formatDate(member.salvation_date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Water Baptism:</span>
                  <span className="font-medium">{formatDate(member.baptism_date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Church Joined:</span>
                  <span className="font-medium">{formatDate(member.joined_date || member.membership_date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5 dark:border-slate-800">
                  <span className="text-slate-500">Previous Church:</span>
                  <span className="font-medium">{member.previous_church || 'None / New Believer'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <span className="font-medium text-right">
                    {profile?.emergency_contact_name || 'N/A'} ({profile?.emergency_contact_phone || 'No phone'})
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Family Tab */}
        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-sky-600" />
                {member.family?.family_name || 'Family Household'}
              </CardTitle>
              <CardDescription className="text-xs">
                Household records, family relationships, and emergency contacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.family ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {member.family.family_name}
                      </span>
                      <span className="text-slate-500">
                        {member.family.address}, {member.family.city}, {member.family.state} {member.family.postal_code}
                      </span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link to="/people/families">View Family Tree</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No family household assigned. Edit profile to link this member to a household.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5 text-sky-600" />
                Service Attendance History
              </CardTitle>
              <CardDescription className="text-xs">
                Log of check-ins and Sunday service attendance records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-xs text-slate-500">No attendance records logged yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check-in Type</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((att) => (
                      <TableRow key={att.id}>
                        <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                          {att.service_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(att.service_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {att.check_in_type?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {formatDate(att.check_in_time, 'h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Ministries Tab */}
        <TabsContent value="ministries" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-sky-600" />
                Assigned Ministries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.ministry ? (
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.ministry.color }} />
                    <h4 className="text-sm font-bold">{member.ministry.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{member.ministry.description}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Not currently assigned to any ministry department.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ChurchIcon className="h-5 w-5 text-sky-600" />
                Small Group Placement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.group ? (
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.group.name}</h4>
                  <p className="text-slate-500">{member.group.description}</p>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 pt-1">
                    <span>Meets: {member.group.meeting_day} at {member.group.meeting_time}</span>
                    <span>•</span>
                    <span>Location: {member.group.location}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Not currently enrolled in a small group.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-600" />
                Event Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              <p>Registered conferences, baptism retreats, and community volunteer drives.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Giving Tab */}
        <TabsContent value="giving" className="space-y-4">
          {(!['super_admin', 'church_admin', 'pastor'].includes(currentRole || '') && (!user?.id || user.id !== member.user_id)) ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-8 text-center space-y-2">
                <Lock className="h-8 w-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confidential Financial Records</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Individual donation histories and tax receipts are strictly confidential and restricted to authorized church financial administrators.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <CardContent className="p-4">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Lifetime Giving</span>
                    <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(totalGiving)}
                    </p>
                    <span className="text-[10px] text-slate-400">{donations.length} total contributions</span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tax-Deductible Gifts</span>
                    <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                      {formatCurrency(donations.filter((d) => d.is_tax_deductible).reduce((sum, d) => sum + Number(d.amount), 0))}
                    </p>
                    <span className="text-[10px] text-slate-400">Included in tax statements</span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Average Gift Amount</span>
                    <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                      {donations.length > 0 ? formatCurrency(totalGiving / donations.length) : '$0.00'}
                    </p>
                    <span className="text-[10px] text-slate-400">Per contribution</span>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      Giving History & Contributions
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Itemized contribution receipts and designated fund gifts for {member.profile?.first_name} {member.profile?.last_name}.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                      onClick={() => setIsStatementDialogOpen(true)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Giving Statement
                    </Button>

                    {['super_admin', 'church_admin'].includes(currentRole || '') && (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setIsDonationDialogOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Record Donation
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {donations.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No contribution records logged for this member.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fund Designation</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Reference / Check #</TableHead>
                          <TableHead>Tax Deductible</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                              {d.fund_name}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-xs text-emerald-600">
                              {formatCurrency(Number(d.amount))}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                              {d.payment_method?.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">{formatDate(d.donation_date)}</TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-400">{d.reference_number || 'N/A'}</TableCell>
                            <TableCell className="text-xs">
                              <Badge variant={d.is_tax_deductible ? 'outline' : 'secondary'} className="text-[10px]">
                                {d.is_tax_deductible ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 8. Prayer Requests Tab */}
        <TabsContent value="prayers" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-600" />
                  Submitted Prayer Requests
                </CardTitle>
                <CardDescription className="text-xs">
                  Prayer petitions and answered praise reports for this member
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsPrayerDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Prayer Request
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {prayerRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No prayer requests recorded for this member.</p>
              ) : (
                prayerRequests.map((pr) => (
                  <div key={pr.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{pr.title}</h4>
                        <Badge variant="outline" className="text-[9px] capitalize">{pr.privacy?.replace('_', ' ')}</Badge>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(pr.created_at)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{pr.description || pr.request}</p>
                    {pr.is_answered && pr.praise_report && (
                      <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                        Praise: "{pr.praise_report}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9. Follow-ups Tab */}
        <TabsContent value="followups" className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-sky-600" />
                  Pastoral Care Follow-ups
                </CardTitle>
                <CardDescription className="text-xs">
                  Pastoral care tickets, counseling, visits, and interaction logs
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 text-sky-600 border-sky-200 hover:bg-sky-50"
                onClick={() => setIsFollowUpDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Follow-up Task
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {followUps.length === 0 ? (
                <p className="text-xs text-slate-500">No follow-ups pending for this member.</p>
              ) : (
                followUps.map((fu) => (
                  <div key={fu.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{fu.title}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="capitalize text-[10px]">{fu.type?.replace('_', ' ')}</Badge>
                        <Badge variant="secondary" className="capitalize text-[10px]">{fu.status}</Badge>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{fu.notes}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Due Date: {formatDate(fu.due_date)}</span>
                      {fu.history && fu.history.length > 0 && (
                        <span className="text-sky-600 font-medium">{fu.history.length} contact entries logged</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 10. Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-600" />
                Pastoral & Administrative Care Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60 text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {member.notes || 'No notes on file.'}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Append New Pastoral Note
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter counseling observations, prayer requests, or pastoral visit notes..."
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="text-xs">
                  Append Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <MemberFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateMember}
        initialData={member}
        mode="edit"
      />

      {/* Member Prayer Request Dialog */}
      <PrayerFormDialog
        isOpen={isPrayerDialogOpen}
        onClose={() => setIsPrayerDialogOpen(false)}
        onSave={async (payload) => {
          if (!activeChurch || !member) return;
          await prayerService.createPrayerRequest(activeChurch.id, {
            ...(payload as CreatePrayerPayload),
            member_id: member.id,
            author_name: `${member.profile?.first_name} ${member.profile?.last_name}`,
            author_email: member.profile?.email || undefined,
            author_phone: member.profile?.phone || undefined,
          });
          loadMemberData();
          toast.success('Prayer request logged for member.');
        }}
        mode="create"
        currentUserName={`${member.profile?.first_name} ${member.profile?.last_name}`}
        currentUserEmail={member.profile?.email || ''}
      />

      {/* Member Follow-up Task Dialog */}
      <FollowUpFormDialog
        isOpen={isFollowUpDialogOpen}
        onClose={() => setIsFollowUpDialogOpen(false)}
        onSave={async (payload) => {
          if (!activeChurch || !member) return;
          await followUpService.createFollowUp(activeChurch.id, payload as CreateFollowUpPayload);
          loadMemberData();
          toast.success('Pastoral care task created for member.');
        }}
        mode="create"
        defaultMemberId={member.id}
      />

      {/* Member Donation Dialog */}
      <DonationFormDialog
        isOpen={isDonationDialogOpen}
        onClose={() => setIsDonationDialogOpen(false)}
        onSave={async (payload) => {
          if (!activeChurch) return;
          await financeService.createDonation(activeChurch.id, payload as CreateDonationPayload, {
            userId: user?.id,
            userName: `${member.profile?.first_name} ${member.profile?.last_name}`,
            userRole: currentRole || 'Admin',
          });
          loadMemberData();
          toast.success('Donation recorded for member.');
        }}
        funds={funds}
        mode="create"
        defaultMemberId={member.id}
      />

      {/* Member Giving Statement Modal */}
      {activeChurch && (
        <GivingStatementModal
          isOpen={isStatementDialogOpen}
          onClose={() => setIsStatementDialogOpen(false)}
          churchId={activeChurch.id}
          funds={funds}
          defaultMemberId={member.id}
        />
      )}
    </div>
  );
}
