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
import { Ministry, OrgStatus, ChurchMember } from '@/types/database';
import { CreateMinistryPayload } from '@/services/ministryService';
import { Layers, Mail, Phone, Clock, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface MinistryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateMinistryPayload) => Promise<void>;
  initialData?: Ministry | null;
  availableMembers?: ChurchMember[];
  mode?: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

export function MinistryFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableMembers = [],
  mode = 'create',
}: MinistryFormDialogProps) {
  const [formData, setFormData] = useState<CreateMinistryPayload>({
    name: '',
    description: '',
    leader_id: '',
    assistant_leader_id: '',
    status: 'active',
    meeting_schedule: '',
    email: '',
    phone: '',
    color: '#6366f1',
    icon: 'Layers',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        leader_id: initialData.leader_id || '',
        assistant_leader_id: initialData.assistant_leader_id || '',
        status: initialData.status || 'active',
        meeting_schedule: initialData.meeting_schedule || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        color: initialData.color || '#6366f1',
        icon: initialData.icon || 'Layers',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        leader_id: '',
        assistant_leader_id: '',
        status: 'active',
        meeting_schedule: '',
        email: '',
        phone: '',
        color: '#6366f1',
        icon: 'Layers',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field: keyof CreateMinistryPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Ministry name is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save ministry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-600" />
              {mode === 'create' ? 'Create Ministry Department' : 'Edit Ministry Department'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure leadership assignments, meeting schedules, and contact info for this ministry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ministry Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Worship & Creative Arts"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description & Purpose
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the mission and responsibilities of this ministry department..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ministry Leader
                </label>
                <Select
                  value={formData.leader_id || 'none'}
                  onValueChange={(val) => handleChange('leader_id', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Unassigned</SelectItem>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name || m.profile?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assistant Leader
                </label>
                <Select
                  value={formData.assistant_leader_id || 'none'}
                  onValueChange={(val) => handleChange('assistant_leader_id', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select co-leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name || m.profile?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meeting Schedule / Rehearsal Time
                </label>
                <Input
                  value={formData.meeting_schedule || ''}
                  onChange={(e) => handleChange('meeting_schedule', e.target.value)}
                  placeholder="e.g. Thursday Rehearsals 6:30 PM & Sunday 7:45 AM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ministry Email
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="worship@gracevalley.org"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ministry Phone
                </label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(val) => handleChange('status', val as OrgStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department Color
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange('color', c)}
                      className={`h-6 w-6 rounded-full transition-transform ${formData.color === c ? 'scale-110 ring-2 ring-sky-500 ring-offset-2' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Ministry' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
