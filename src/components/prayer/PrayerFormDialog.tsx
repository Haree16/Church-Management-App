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
  PrayerRequest,
  PrayerPrivacy,
  PrayerStatus,
  PrayerCategory,
} from '@/types/database';
import {
  CreatePrayerPayload,
  UpdatePrayerPayload,
  PRAYER_CATEGORIES,
  PRAYER_PRIVACY_LEVELS,
  PRAYER_STATUSES,
} from '@/services/prayerService';
import { DEMO_MINISTRIES, DEMO_USERS, DEMO_MEMBERS } from '@/lib/mockData';
import { Heart, Shield, Lock, Users, Globe, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

interface PrayerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreatePrayerPayload | UpdatePrayerPayload) => Promise<void>;
  initialData?: PrayerRequest | null;
  mode?: 'create' | 'edit';
  currentUserName?: string;
  currentUserEmail?: string;
  currentUserId?: string;
}

export function PrayerFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
  currentUserName = '',
  currentUserEmail = '',
  currentUserId = '',
}: PrayerFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState(currentUserName || '');
  const [authorEmail, setAuthorEmail] = useState(currentUserEmail || '');
  const [authorPhone, setAuthorPhone] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [category, setCategory] = useState<PrayerCategory>('general');
  const [privacy, setPrivacy] = useState<PrayerPrivacy>('church_wide');
  const [status, setStatus] = useState<PrayerStatus>('new');
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [praiseReport, setPraiseReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title || '');
      setDescription(initialData.description || initialData.request || '');
      setAuthorName(initialData.author_name || '');
      setAuthorEmail(initialData.author_email || '');
      setAuthorPhone(initialData.author_phone || '');
      setMemberId(initialData.member_id || null);
      setCategory((initialData.category as PrayerCategory) || 'general');
      setPrivacy(initialData.privacy || (initialData.is_confidential ? 'pastor_only' : 'church_wide'));
      setStatus(initialData.status || (initialData.is_answered ? 'answered' : 'new'));
      setAssignedTeamId(initialData.assigned_team_id || null);
      setAssignedTo(initialData.assigned_to || null);
      setNotes(initialData.notes || '');
      setPraiseReport(initialData.praise_report || '');
    } else {
      setTitle('');
      setDescription('');
      setAuthorName(currentUserName || '');
      setAuthorEmail(currentUserEmail || '');
      setAuthorPhone('');
      setMemberId(currentUserId ? `cm-${currentUserId}` : null);
      setCategory('general');
      setPrivacy('church_wide');
      setStatus('new');
      setAssignedTeamId(null);
      setAssignedTo(null);
      setNotes('');
      setPraiseReport('');
    }
    setErrors({});
  }, [initialData, mode, isOpen, currentUserName, currentUserEmail, currentUserId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Prayer request title is required';
    if (!description.trim()) newErrors.description = 'Prayer request description is required';
    if (!authorName.trim()) newErrors.authorName = 'Submitted by / Author name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreatePrayerPayload = {
          title: title.trim(),
          description: description.trim(),
          author_name: authorName.trim(),
          author_email: authorEmail.trim() || undefined,
          author_phone: authorPhone.trim() || undefined,
          member_id: memberId,
          category,
          privacy,
          assigned_team_id: assignedTeamId,
          assigned_to: assignedTo,
          notes: notes.trim() || undefined,
        };
        await onSave(payload);
        toast.success('Prayer request submitted successfully.');
      } else {
        const payload: UpdatePrayerPayload = {
          title: title.trim(),
          request: description.trim(),
          description: description.trim(),
          category,
          privacy,
          status,
          assigned_team_id: assignedTeamId,
          assigned_to: assignedTo,
          notes: notes.trim() || undefined,
          praise_report: status === 'answered' ? praiseReport.trim() : undefined,
          is_answered: status === 'answered',
        };
        await onSave(payload);
        toast.success('Prayer request updated successfully.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prayer request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrivacyIcon = (level: PrayerPrivacy) => {
    switch (level) {
      case 'church_wide':
        return <Globe className="h-4 w-4 text-emerald-500" />;
      case 'prayer_team':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'pastor_only':
        return <Shield className="h-4 w-4 text-amber-500" />;
      case 'private':
        return <Lock className="h-4 w-4 text-rose-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Heart className="h-5 w-5 fill-rose-600" />
              <DialogTitle className="text-lg">
                {mode === 'create' ? 'Submit Prayer Request' : 'Edit Prayer Request'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Bring requests, burdens, and praise reports before God and the church prayer network.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Prayer Title / Topic *
              </label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="e.g. Healing & Full Recovery for Sister Martha"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <span className="text-[10px] text-red-500">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Prayer Request Details & Petitions *
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder="Please describe the situation, specific scripture prayers, or how intercessors can pray..."
                rows={4}
                className={`w-full rounded-md border bg-transparent p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800 ${
                  errors.description ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.description && <span className="text-[10px] text-red-500">{errors.description}</span>}
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Submitted by *
                </label>
                <Input
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (errors.authorName) setErrors((prev) => ({ ...prev, authorName: '' }));
                  }}
                  placeholder="e.g. Sarah Jenkins or Anonymous"
                  className={errors.authorName ? 'border-red-500' : ''}
                />
                {errors.authorName && <span className="text-[10px] text-red-500">{errors.authorName}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Contact Email (Optional)
                </label>
                <Input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="author@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Phone (Optional)
                </label>
                <Input
                  value={authorPhone}
                  onChange={(e) => setAuthorPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Category & Privacy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <Select value={category} onValueChange={(val) => setCategory(val as PrayerCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRAYER_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy Level */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Privacy Level *</span>
                  <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                    {getPrivacyIcon(privacy)} {privacy.replace('_', ' ').toUpperCase()}
                  </span>
                </label>
                <Select value={privacy} onValueChange={(val) => setPrivacy(val as PrayerPrivacy)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Privacy Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRAYER_PRIVACY_LEVELS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex flex-col text-left py-0.5">
                          <span className="font-medium text-xs">{p.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignments & Status (Edit Mode or Leadership View) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              {/* Status */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Prayer Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as PrayerStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRAYER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Prayer Team */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Prayer Team
                </label>
                <Select
                  value={assignedTeamId || 'none'}
                  onValueChange={(val) => setAssignedTeamId(val === 'none' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team Assigned</SelectItem>
                    {DEMO_MINISTRIES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Pastor / Caregiver */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Pastor / Caregiver
                </label>
                <Select
                  value={assignedTo || 'none'}
                  onValueChange={(val) => setAssignedTo(val === 'none' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Pastor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {DEMO_USERS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Answered Praise Report (if answered) */}
            {status === 'answered' && (
              <div className="space-y-1 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <label className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Answered Praise Report / Testimony
                </label>
                <textarea
                  value={praiseReport}
                  onChange={(e) => setPraiseReport(e.target.value)}
                  placeholder="Share how God answered this prayer to testify His goodness..."
                  rows={3}
                  className="w-full rounded-md border border-emerald-200 bg-white dark:bg-slate-900 p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-emerald-800"
                />
              </div>
            )}

            {/* Additional Pastoral Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Internal Care Notes / Updates
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional background notes for prayer team or pastors..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              isLoading={isSubmitting}
            >
              {mode === 'create' ? 'Submit Prayer Request' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
