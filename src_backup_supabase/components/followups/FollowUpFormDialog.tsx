import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FollowUp,
  FollowUpType,
  FollowUpPriority,
  FollowUpStatus,
} from '@/types/database';
import {
  CreateFollowUpPayload,
  UpdateFollowUpPayload,
  FOLLOW_UP_TYPES,
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_STATUSES,
} from '@/services/followUpService';
import { DEMO_USERS, DEMO_MEMBERS, DEMO_VISITORS } from '@/lib/mockData';
import { MessageSquare, Calendar, UserCheck, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';

interface FollowUpFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateFollowUpPayload | UpdateFollowUpPayload) => Promise<void>;
  initialData?: FollowUp | null;
  mode?: 'create' | 'edit';
  currentUserId?: string;
  defaultMemberId?: string;
  defaultVisitorId?: string;
  defaultPrayerRequestId?: string;
}

export function FollowUpFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
  currentUserId,
  defaultMemberId,
  defaultVisitorId,
  defaultPrayerRequestId,
}: FollowUpFormDialogProps) {
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  };

  const [title, setTitle] = useState('');
  const [type, setType] = useState<FollowUpType>('other');
  const [priority, setPriority] = useState<FollowUpPriority>('medium');
  const [status, setStatus] = useState<FollowUpStatus>('pending');
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(currentUserId || 'u0000000-0000-0000-0000-000000000002');
  const [personSelectionType, setPersonSelectionType] = useState<'member' | 'visitor' | 'custom'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(defaultMemberId || null);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(defaultVisitorId || null);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title || '');
      setType(initialData.type || 'other');
      setPriority(initialData.priority || 'medium');
      setStatus(initialData.status || 'pending');
      setDueDate(initialData.due_date || getDefaultDueDate());
      setNotes(initialData.notes || '');
      setAssignedTo(initialData.assigned_to || null);

      if (initialData.member_id) {
        setPersonSelectionType('member');
        setSelectedMemberId(initialData.member_id);
      } else if (initialData.visitor_id) {
        setPersonSelectionType('visitor');
        setSelectedVisitorId(initialData.visitor_id);
      } else {
        setPersonSelectionType('custom');
        setCustomName(initialData.person_name || '');
        setCustomPhone(initialData.person_phone || '');
        setCustomEmail(initialData.person_email || '');
      }
    } else {
      setTitle('');
      setType('new_visitor');
      setPriority('medium');
      setStatus('pending');
      setDueDate(getDefaultDueDate());
      setNotes('');
      setAssignedTo(currentUserId || 'u0000000-0000-0000-0000-000000000002');
      if (defaultMemberId) {
        setPersonSelectionType('member');
        setSelectedMemberId(defaultMemberId);
        const mem = DEMO_MEMBERS.find((m) => m.id === defaultMemberId);
        if (mem) setTitle(`Follow up with ${mem.profile?.first_name} ${mem.profile?.last_name}`);
      } else if (defaultVisitorId) {
        setPersonSelectionType('visitor');
        setSelectedVisitorId(defaultVisitorId);
        const vis = DEMO_VISITORS.find((v) => v.id === defaultVisitorId);
        if (vis) setTitle(`Follow up with ${vis.first_name} ${vis.last_name}`);
      } else {
        setPersonSelectionType('member');
        setSelectedMemberId(null);
        setSelectedVisitorId(null);
      }
      setCustomName('');
      setCustomPhone('');
      setCustomEmail('');
    }
    setErrors({});
  }, [initialData, mode, isOpen, currentUserId, defaultMemberId, defaultVisitorId]);

  // Automatically update title if empty when person changes
  const handleMemberChange = (id: string | null) => {
    setSelectedMemberId(id);
    if (!title || title.startsWith('Follow up with')) {
      const mem = DEMO_MEMBERS.find((m) => m.id === id);
      if (mem) setTitle(`Follow up with ${mem.profile?.first_name} ${mem.profile?.last_name}`);
    }
  };

  const handleVisitorChange = (id: string | null) => {
    setSelectedVisitorId(id);
    if (!title || title.startsWith('Follow up with')) {
      const vis = DEMO_VISITORS.find((v) => v.id === id);
      if (vis) setTitle(`Follow up with ${vis.first_name} ${vis.last_name}`);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (personSelectionType === 'custom' && !customName.trim()) {
      newErrors.customName = 'Person name is required';
    }
    if (personSelectionType === 'member' && !selectedMemberId) {
      newErrors.member = 'Please select a church member';
    }
    if (personSelectionType === 'visitor' && !selectedVisitorId) {
      newErrors.visitor = 'Please select a visitor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors.');
      return;
    }

    let personName: string | null = null;
    let personPhone: string | null = null;
    let personEmail: string | null = null;

    if (personSelectionType === 'member') {
      const mem = DEMO_MEMBERS.find((m) => m.id === selectedMemberId);
      if (mem) {
        personName = `${mem.profile?.first_name} ${mem.profile?.last_name}`.trim();
        personPhone = mem.profile?.phone || null;
        personEmail = mem.profile?.email || null;
      }
    } else if (personSelectionType === 'visitor') {
      const vis = DEMO_VISITORS.find((v) => v.id === selectedVisitorId);
      if (vis) {
        personName = `${vis.first_name} ${vis.last_name}`.trim();
        personPhone = vis.phone || null;
        personEmail = vis.email || null;
      }
    } else {
      personName = customName.trim();
      personPhone = customPhone.trim() || null;
      personEmail = customEmail.trim() || null;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreateFollowUpPayload = {
          title: title.trim(),
          type,
          priority,
          status,
          due_date: dueDate,
          notes: notes.trim() || undefined,
          assigned_to: assignedTo,
          member_id: personSelectionType === 'member' ? selectedMemberId : null,
          visitor_id: personSelectionType === 'visitor' ? selectedVisitorId : null,
          prayer_request_id: defaultPrayerRequestId || null,
          person_name: personName,
          person_phone: personPhone,
          person_email: personEmail,
          created_by: currentUserId || null,
        };
        await onSave(payload);
        toast.success('Pastoral follow-up task created.');
      } else {
        const payload: UpdateFollowUpPayload = {
          title: title.trim(),
          type,
          priority,
          status,
          due_date: dueDate,
          notes: notes.trim() || undefined,
          assigned_to: assignedTo,
          person_name: personName,
          person_phone: personPhone,
          person_email: personEmail,
        };
        await onSave(payload);
        toast.success('Follow-up task updated.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save follow-up task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <MessageSquare className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {mode === 'create' ? 'Create Pastoral Follow-up Task' : 'Edit Follow-up Task'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Assign pastoral care, visitation, counseling check-in, or visitor connection tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Person Selection Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-sky-600" />
                  Select Person to Follow Up *
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPersonSelectionType('member')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      personSelectionType === 'member'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonSelectionType('visitor')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      personSelectionType === 'visitor'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Visitor / Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonSelectionType('custom')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      personSelectionType === 'custom'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Custom Contact
                  </button>
                </div>
              </div>

              {personSelectionType === 'member' && (
                <div className="space-y-1">
                  <Select
                    value={selectedMemberId || 'none'}
                    onValueChange={(val) => handleMemberChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger className={errors.member ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select Church Member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a church member...</SelectItem>
                      {DEMO_MEMBERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`} ({m.membership_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.member && <span className="text-[10px] text-red-500">{errors.member}</span>}
                </div>
              )}

              {personSelectionType === 'visitor' && (
                <div className="space-y-1">
                  <Select
                    value={selectedVisitorId || 'none'}
                    onValueChange={(val) => handleVisitorChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger className={errors.visitor ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select Guest / Visitor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a visitor...</SelectItem>
                      {DEMO_VISITORS.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.first_name} {v.last_name} (Visited {v.visit_date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.visitor && <span className="text-[10px] text-red-500">{errors.visitor}</span>}
                </div>
              )}

              {personSelectionType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Contact Name *"
                      className={errors.customName ? 'border-red-500' : ''}
                    />
                    {errors.customName && <span className="text-[10px] text-red-500">{errors.customName}</span>}
                  </div>
                  <div className="space-y-1">
                    <Input
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Email Address"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Follow-up Title / Purpose *
              </label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g. First-Time Visitor Welcome Call & Life Group Invite"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <span className="text-[10px] text-red-500">{errors.title}</span>}
            </div>

            {/* Type & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Follow-up Type *
                </label>
                <Select value={type} onValueChange={(val) => setType(val as FollowUpType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium">{t.label}</span>
                          <span className="text-[10px] text-slate-400">{t.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Priority Level *
                </label>
                <Select value={priority} onValueChange={(val) => setPriority(val as FollowUpPriority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assigned User & Due Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Assigned Staff */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Staff / Pastor
                </label>
                <Select
                  value={assignedTo || 'none'}
                  onValueChange={(val) => setAssignedTo(val === 'none' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {DEMO_USERS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Due Date *
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as FollowUpStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOW_UP_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Pastoral Care Notes & Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail key care objectives, background context, hospital room numbers, or questions to ask..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Follow-up Task' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
