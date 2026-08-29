import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { memberService, CreateMemberPayload } from '@/services/memberService';
import { ChurchMember, MemberStatus, Gender } from '@/types/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CanAccess } from '@/components/ui/can-access';
import { MemberFormDialog } from '@/components/people/MemberFormDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, formatDate } from '@/lib/utils';
import { ROLE_DEFINITIONS } from '@/lib/permissions';
import { DEMO_MINISTRIES, DEMO_GROUPS, DEMO_FAMILIES } from '@/lib/mockData';
import {
  Search,
  UserPlus,
  Users,
  Phone,
  Mail,
  Filter,
  Download,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export function MembersPage() {
  const { activeChurch, currentRole } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<ChurchMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'joined_date' | 'status' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ChurchMember | null>(null);
  const [memberToArchive, setMemberToArchive] = useState<ChurchMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<ChurchMember | null>(null);

  const loadMembers = async () => {
    if (!activeChurch) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await memberService.getMembers(activeChurch.id);
      setMembers(data);
    } catch (err: any) {
      console.error('Failed to load members:', err);
      setError(err.message || 'Failed to load member records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeChurch]);

  // Filtering & Sorting logic
  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter((member) => {
        const profile = member.profile;
        const name = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`;
        const email = profile?.email || '';
        const phone = profile?.phone || '';
        const memberId = member.membership_number || '';
        const prevChurch = member.previous_church || '';
        const occ = profile?.occupation || '';

        // Search match
        const matchesSearch =
          searchTerm === '' ||
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prevChurch.toLowerCase().includes(searchTerm.toLowerCase()) ||
          occ.toLowerCase().includes(searchTerm.toLowerCase());

        // Status match
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

        // Gender match
        const matchesGender = genderFilter === 'all' || profile?.gender === genderFilter;

        // Ministry match
        const matchesMinistry = ministryFilter === 'all' || member.ministry_id === ministryFilter;

        // Group match
        const matchesGroup = groupFilter === 'all' || member.group_id === groupFilter;

        // Family match
        const matchesFamily = familyFilter === 'all' || member.family_id === familyFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesGender &&
          matchesMinistry &&
          matchesGroup &&
          matchesFamily
        );
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') {
          const nameA = a.profile?.display_name || `${a.profile?.first_name} ${a.profile?.last_name}`;
          const nameB = b.profile?.display_name || `${b.profile?.first_name} ${b.profile?.last_name}`;
          comp = nameA.localeCompare(nameB);
        } else if (sortBy === 'joined_date') {
          const dateA = a.joined_date || a.membership_date || '';
          const dateB = b.joined_date || b.membership_date || '';
          comp = dateA.localeCompare(dateB);
        } else if (sortBy === 'status') {
          comp = a.status.localeCompare(b.status);
        } else if (sortBy === 'id') {
          comp = (a.membership_number || '').localeCompare(b.membership_number || '');
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [
    members,
    searchTerm,
    statusFilter,
    genderFilter,
    ministryFilter,
    groupFilter,
    familyFilter,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredAndSortedMembers.length / pageSize) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedMembers.slice(start, start + pageSize);
  }, [filteredAndSortedMembers, currentPage, pageSize]);

  // Handlers
  const handleCreateMember = async (payload: CreateMemberPayload) => {
    if (!activeChurch) return;
    const created = await memberService.createMember(activeChurch.id, payload);
    setMembers((prev) => [created, ...prev]);
    toast.success(`Member ${payload.first_name} ${payload.last_name} added successfully!`);
  };

  const handleUpdateMember = async (payload: CreateMemberPayload) => {
    if (!activeChurch || !editingMember) return;
    const updated = await memberService.updateMember(activeChurch.id, editingMember.id, payload);
    setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? updated : m)));
    toast.success(`Member record updated!`);
    setEditingMember(null);
  };

  const handleArchiveConfirm = async () => {
    if (!activeChurch || !memberToArchive) return;
    try {
      await memberService.archiveMember(activeChurch.id, memberToArchive.id);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberToArchive.id ? { ...m, status: 'archived' } : m))
      );
      toast.info(`Member record for ${memberToArchive.profile?.display_name} archived.`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to archive member.');
    } finally {
      setMemberToArchive(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeChurch || !memberToDelete) return;
    try {
      await memberService.deleteMember(activeChurch.id, memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      toast.success('Member record deleted.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete member.');
    } finally {
      setMemberToDelete(null);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredAndSortedMembers.length === 0) {
      toast.error('No member records to export.');
      return;
    }

    const headers = [
      'Member ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gender',
      'Date of Birth',
      'Marital Status',
      'Role',
      'Status',
      'Joined Date',
      'Baptism Date',
      'Salvation Date',
      'Occupation',
      'Address',
      'City',
      'State',
      'Postal Code',
      'Emergency Contact Name',
      'Emergency Contact Phone',
    ];

    const rows = filteredAndSortedMembers.map((m) => {
      const p = m.profile;
      return [
        `"${m.membership_number || ''}"`,
        `"${p?.first_name || ''}"`,
        `"${p?.last_name || ''}"`,
        `"${p?.email || ''}"`,
        `"${p?.phone || ''}"`,
        `"${p?.gender || ''}"`,
        `"${p?.dob || ''}"`,
        `"${p?.marital_status || ''}"`,
        `"${m.role || ''}"`,
        `"${m.status || ''}"`,
        `"${m.joined_date || m.membership_date || ''}"`,
        `"${m.baptism_date || ''}"`,
        `"${m.salvation_date || ''}"`,
        `"${p?.occupation || ''}"`,
        `"${p?.address || ''}"`,
        `"${p?.city || ''}"`,
        `"${p?.state || ''}"`,
        `"${p?.postal_code || ''}"`,
        `"${p?.emergency_contact_name || ''}"`,
        `"${p?.emergency_contact_phone || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `church_members_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredAndSortedMembers.length} member records to CSV.`);
  };

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="emerald">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'transferred':
        return <Badge variant="blue">Transferred</Badge>;
      case 'moved_away':
        return <Badge variant="amber">Moved Away</Badge>;
      case 'archived':
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Members Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage congregation members, personal records, spiritual milestones, and leadership assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs border-slate-200 shadow-xs"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <CanAccess permission="members:create">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </CanAccess>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by name, email, phone, member ID, or occupation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              icon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="moved_away">Moved Away</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select
              value={genderFilter}
              onValueChange={(val) => {
                setGenderFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Ministry Filter */}
            <Select
              value={ministryFilter}
              onValueChange={(val) => {
                setMinistryFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Ministry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ministries</SelectItem>
                {DEMO_MINISTRIES.map((min) => (
                  <SelectItem key={min.id} value={min.id}>
                    {min.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Small Group Filter */}
            <Select
              value={groupFilter}
              onValueChange={(val) => {
                setGroupFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-36 h-9 text-xs">
                <SelectValue placeholder="Small Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {DEMO_GROUPS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-9 gap-1 text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadMembers} />
      ) : filteredAndSortedMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-sky-600" />}
          title="No member records found"
          description="Try broadening your search keywords or clear your active filters."
          actionLabel="Clear All Filters"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setGenderFilter('all');
            setMinistryFilter('all');
            setGroupFilter('all');
            setFamilyFilter('all');
          }}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>ID & Role</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Ministry & Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMembers.map((member) => {
                const profile = member.profile;
                const roleDef = ROLE_DEFINITIONS[member.role];
                const displayName = profile?.display_name || `${profile?.first_name} ${profile?.last_name}`;

                return (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    onClick={() => navigate(`/people/members/${member.id}`)}
                  >
                    {/* Member Name & Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-slate-200">
                          <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                          <AvatarFallback>{getInitials(displayName, profile?.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors">
                            {displayName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {profile?.occupation || (profile?.gender ? `${profile.gender.toUpperCase()} • ${profile.marital_status || 'Single'}` : 'Member')}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Member ID & Role */}
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                          {member.membership_number || 'N/A'}
                        </span>
                        <Badge variant={roleDef?.badgeVariant || 'default'} className="text-[10px] uppercase">
                          {roleDef?.name || member.role}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{profile?.email}</span>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Ministry & Group */}
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {member.ministry ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.ministry.color }} />
                            {member.ministry.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No ministry</span>
                        )}
                        {member.group && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {member.group.name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(member.status)}</TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      {formatDate(member.joined_date || member.membership_date, 'MMM d, yyyy')}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/people/members/${member.id}`)}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                          <span className="sr-only">View</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/people/members/${member.id}`)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View Full Profile
                            </DropdownMenuItem>

                            <CanAccess permission="members:update">
                              <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                <Edit2 className="mr-2 h-3.5 w-3.5" />
                                Edit Record
                              </DropdownMenuItem>
                            </CanAccess>

                            <CanAccess permission="members:update">
                              <DropdownMenuItem
                                onClick={() => setMemberToArchive(member)}
                                className="text-amber-600"
                              >
                                <Archive className="mr-2 h-3.5 w-3.5" />
                                Archive Member
                              </DropdownMenuItem>
                            </CanAccess>

                            <CanAccess permission="members:delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setMemberToDelete(member)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete Record
                              </DropdownMenuItem>
                            </CanAccess>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredAndSortedMembers.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Member Add/Edit Dialog */}
      <MemberFormDialog
        isOpen={isAddOpen || !!editingMember}
        onClose={() => {
          setIsAddOpen(false);
          setEditingMember(null);
        }}
        onSave={editingMember ? handleUpdateMember : handleCreateMember}
        initialData={editingMember}
        mode={editingMember ? 'edit' : 'create'}
      />

      {/* Archive Confirmation Dialog */}
      <Dialog open={!!memberToArchive} onOpenChange={(open) => !open && setMemberToArchive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Archive Member Record</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to archive <strong>{memberToArchive?.profile?.display_name}</strong>? They will be marked as archived and hidden from active ministry rosters.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToArchive(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleArchiveConfirm} className="bg-amber-600 hover:bg-amber-700 text-white">
              Confirm Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Member Record</DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently delete the membership record for <strong>{memberToDelete?.profile?.display_name}</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
