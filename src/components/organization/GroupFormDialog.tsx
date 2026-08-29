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
import { Group, OrgStatus, ChurchMember, Ministry } from '@/types/database';
import { CreateGroupPayload } from '@/services/groupService';
import { Users, MapPin, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface GroupFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateGroupPayload) => Promise<void>;
  initialData?: Group | null;
  availableMembers?: ChurchMember[];
  availableMinistries?: Ministry[];
  mode?: 'create' | 'edit';
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly'];
const CATEGORIES = ['General', 'Young Adults', "Men's Ministry", "Women's Ministry", 'Families', 'Couples', 'Seniors', 'Youth'];

export function GroupFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableMembers = [],
  availableMinistries = [],
  mode = 'create',
}: GroupFormDialogProps) {
  const [formData, setFormData] = useState<CreateGroupPayload>({
    name: '',
    category: 'General',
    description: '',
    leader_id: '',
    co_leader_id: '',
    ministry_id: '',
    meeting_day: 'Tuesday',
    meeting_time: '07:00 PM',
    frequency: 'Weekly',
    location: "Leader's Home",
    address: '',
    capacity: 20,
    status: 'active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'General',
        description: initialData.description || '',
        leader_id: initialData.leader_id || '',
        co_leader_id: initialData.co_leader_id || '',
        ministry_id: initialData.ministry_id || '',
        meeting_day: initialData.meeting_day || 'Tuesday',
        meeting_time: initialData.meeting_time || '07:00 PM',
        frequency: initialData.frequency || 'Weekly',
        location: initialData.location || "Leader's Home",
        address: initialData.address || '',
        capacity: initialData.capacity || 20,
        status: initialData.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        category: 'General',
        description: '',
        leader_id: '',
        co_leader_id: '',
        ministry_id: '',
        meeting_day: 'Tuesday',
        meeting_time: '07:00 PM',
        frequency: 'Weekly',
        location: "Leader's Home",
        address: '',
        capacity: 20,
        status: 'active',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field: keyof CreateGroupPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.name.trim()) err.name = 'Group name is required';
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
      toast.error(err.message || 'Failed to save group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              {mode === 'create' ? 'Create Life Group / Small Group' : 'Edit Small Group'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Establish small group cohorts, meeting locations, and assigned leaders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Group Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. North Austin Young Adults"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category / Focus
                </label>
                <Select
                  value={formData.category || 'General'}
                  onValueChange={(val) => handleChange('category', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Associated Ministry
                </label>
                <Select
                  value={formData.ministry_id || 'none'}
                  onValueChange={(val) => handleChange('ministry_id', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ministry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Independent</SelectItem>
                    {availableMinistries.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Group Leader
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
                  Assistant / Co-Leader
                </label>
                <Select
                  value={formData.co_leader_id || 'none'}
                  onValueChange={(val) => handleChange('co_leader_id', val === 'none' ? undefined : val)}
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meeting Day
                </label>
                <Select
                  value={formData.meeting_day || 'Tuesday'}
                  onValueChange={(val) => handleChange('meeting_day', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meeting Time
                </label>
                <Input
                  value={formData.meeting_time || ''}
                  onChange={(e) => handleChange('meeting_time', e.target.value)}
                  placeholder="07:00 PM"
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meeting Location Name
                </label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. David & Sarah's Home"
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Max Capacity
                </label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.capacity || 20}
                  onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 20)}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Street Address
                </label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="No. 12, Mount Road, Anna Salai, Chennai"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Group Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter study topic, age range, fellowship description..."
                  rows={2}
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Group' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
