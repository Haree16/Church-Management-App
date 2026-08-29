import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { visitorService, CreateVisitorPayload } from '@/services/visitorService';
import { Visitor, VisitorStatus } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CanAccess } from '@/components/ui/can-access';
import { VisitorFormDialog } from '@/components/people/VisitorFormDialog';
import { ConvertVisitorDialog } from '@/components/people/ConvertVisitorDialog';
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
import { formatDate } from '@/lib/utils';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Heart,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export function VisitorsPage() {
  const { activeChurch } = useAuth();

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [convertingVisitor, setConvertingVisitor] = useState<Visitor | null>(null);
  const [visitorToDelete, setVisitorToDelete] = useState<Visitor | null>(null);

  const loadVisitors = async () => {
    if (!activeChurch) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await visitorService.getVisitors(activeChurch.id);
      setVisitors(data);
    } catch (err: any) {
      console.error('Failed to load visitors:', err);
      setError(err.message || 'Failed to load guest records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, [activeChurch]);

  const handleCreateVisitor = async (payload: CreateVisitorPayload) => {
    if (!activeChurch) return;
    const created = await visitorService.createVisitor(activeChurch.id, payload);
    setVisitors((prev) => [created, ...prev]);
    toast.success(`First-time guest "${payload.first_name} ${payload.last_name}" recorded!`);
  };

  const handleUpdateVisitor = async (payload: CreateVisitorPayload) => {
    if (!activeChurch || !editingVisitor) return;
    const updated = await visitorService.updateVisitor(activeChurch.id, editingVisitor.id, payload);
    setVisitors((prev) => prev.map((v) => (v.id === editingVisitor.id ? updated : v)));
    toast.success('Visitor record updated.');
    setEditingVisitor(null);
  };

  const handleConvertVisitor = async (visitorId: string, memberPayload: any) => {
    if (!activeChurch) return;
    await visitorService.convertVisitorToMember(activeChurch.id, visitorId, memberPayload);
    await loadVisitors();
  };

  const handleDeleteConfirm = async () => {
    if (!activeChurch || !visitorToDelete) return;
    try {
      await visitorService.deleteVisitor(activeChurch.id, visitorToDelete.id);
      setVisitors((prev) => prev.filter((v) => v.id !== visitorToDelete.id));
      toast.success('Visitor record deleted.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete visitor.');
    } finally {
      setVisitorToDelete(null);
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter((v) => {
      const name = `${v.first_name} ${v.last_name}`.toLowerCase();
      const email = (v.email || '').toLowerCase();
      const phone = (v.phone || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = term === '' || name.includes(term) || email.includes(term) || phone.includes(term);
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchTerm, statusFilter]);

  // Statistics
  const totalGuests = visitors.length;
  const followUpRequired = visitors.filter((v) => v.status === 'follow_up_required').length;
  const connectedGuests = visitors.filter((v) => v.status === 'connected').length;
  const becameMembers = visitors.filter((v) => v.status === 'became_member').length;

  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">New Guest</Badge>;
      case 'contacted':
        return <Badge variant="secondary">Contacted</Badge>;
      case 'follow_up_required':
        return <Badge variant="amber">Follow-up Required</Badge>;
      case 'connected':
        return <Badge variant="blue">Connected</Badge>;
      case 'became_member':
        return <Badge variant="emerald">Became Member</Badge>;
      case 'not_interested':
        return <Badge variant="outline">Not Interested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Visitor & Guest Integration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record first-time Sunday guest cards, automate pastoral follow-ups, and convert visitors into covenant members.
          </p>
        </div>

        <CanAccess permission="members:create">
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
          >
            <UserPlus className="h-4 w-4" />
            Record Sunday Guest
          </Button>
        </CanAccess>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Total Guests Logged</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">{totalGuests}</span>
            <span className="text-xs text-slate-400">visitors</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Follow-up Required</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-amber-600">{followUpRequired}</span>
            <span className="text-xs text-amber-600 font-semibold">pending tasks</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Connected to Groups</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-sky-600">{connectedGuests}</span>
            <span className="text-xs text-sky-600 font-semibold">in fellowship</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-slate-500 font-medium">Became Covenant Members</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-emerald-600">{becameMembers}</span>
            <span className="text-xs text-emerald-600 font-semibold">converted</span>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search visitor by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="h-9 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New Guest</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="became_member">Became Member</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredVisitors.length}</span> guests
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadVisitors} />
      ) : filteredVisitors.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="h-10 w-10 text-sky-600" />}
          title="No visitor records found"
          description="Record first-time Sunday visitors to start their integration journey."
          actionLabel="Record Sunday Guest"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest Name</TableHead>
              <TableHead>Visit Details</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Prayer Request / Notes</TableHead>
              <TableHead>Assigned Leader</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisitors.map((v) => (
              <TableRow key={v.id}>
                {/* Name */}
                <TableCell>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {v.first_name} {v.last_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Party Size: {v.family_size} {v.family_size === 1 ? 'person' : 'people'}
                  </div>
                </TableCell>

                {/* Visit Details */}
                <TableCell>
                  <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(v.visit_date)}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                      {v.service_attended}
                    </div>
                    {v.invited_by && (
                      <div className="text-[10px] text-sky-600">Invited by: {v.invited_by}</div>
                    )}
                  </div>
                </TableCell>

                {/* Contact */}
                <TableCell>
                  <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {v.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{v.email}</span>
                      </div>
                    )}
                    {v.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{v.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Prayer / Notes */}
                <TableCell className="max-w-[200px]">
                  {v.prayer_request ? (
                    <div className="flex items-start gap-1.5 text-xs text-rose-700 dark:text-rose-400">
                      <Heart className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-[11px]">{v.prayer_request}</p>
                    </div>
                  ) : v.notes ? (
                    <p className="line-clamp-2 text-[11px] text-slate-500">{v.notes}</p>
                  ) : (
                    <span className="text-[11px] text-slate-400">No notes</span>
                  )}
                </TableCell>

                {/* Leader */}
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {v.assigned_leader?.display_name || 'Unassigned'}
                </TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(v.status)}</TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {v.status !== 'became_member' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConvertingVisitor(v)}
                        className="h-7 px-2 text-[11px] gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                      >
                        <Sparkles className="h-3 w-3" />
                        Convert to Member
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuLabel>Guest Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingVisitor(v)}>
                          <Edit2 className="mr-2 h-3.5 w-3.5" />
                          Edit Guest Card
                        </DropdownMenuItem>

                        {v.status !== 'became_member' && (
                          <DropdownMenuItem onClick={() => setConvertingVisitor(v)}>
                            <UserPlus className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                            Convert to Member
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setVisitorToDelete(v)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Visitor Add/Edit Dialog */}
      <VisitorFormDialog
        isOpen={isAddOpen || !!editingVisitor}
        onClose={() => {
          setIsAddOpen(false);
          setEditingVisitor(null);
        }}
        onSave={editingVisitor ? handleUpdateVisitor : handleCreateVisitor}
        initialData={editingVisitor}
        mode={editingVisitor ? 'edit' : 'create'}
      />

      {/* Convert Visitor to Member Dialog */}
      <ConvertVisitorDialog
        isOpen={!!convertingVisitor}
        onClose={() => setConvertingVisitor(null)}
        visitor={convertingVisitor}
        onConvert={handleConvertVisitor}
      />

      {/* Delete Visitor Dialog */}
      <Dialog open={!!visitorToDelete} onOpenChange={(open) => !open && setVisitorToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Visitor Record</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove the guest record for <strong>{visitorToDelete?.first_name} {visitorToDelete?.last_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitorToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Guest Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
