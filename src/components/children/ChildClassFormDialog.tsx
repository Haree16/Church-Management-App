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
import { ChildrenClass } from '@/types/database';
import { CreateClassPayload, UpdateClassPayload } from '@/services/childrenService';
import { DEMO_MEMBERS } from '@/lib/mockData';
import { School, Users, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';

interface ChildClassFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateClassPayload | UpdateClassPayload) => Promise<void>;
  initialData?: ChildrenClass | null;
  mode?: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#ec4899', // Pink (Nursery)
  '#f59e0b', // Amber (Toddlers)
  '#0284c7', // Sky (Pre-K)
  '#10b981', // Emerald (Champions)
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ef4444', // Red
];

export function ChildClassFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: ChildClassFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ageRangeMin, setAgeRangeMin] = useState('0');
  const [ageRangeMax, setAgeRangeMax] = useState('11');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [leadTeacherId, setLeadTeacherId] = useState<string>('none');
  const [color, setColor] = useState('#10b981');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setAgeRangeMin(String(initialData.age_range_min ?? 0));
      setAgeRangeMax(String(initialData.age_range_max ?? 11));
      setRoomNumber(initialData.room_number || '');
      setMaxCapacity(initialData.max_capacity ? String(initialData.max_capacity) : '');
      setLeadTeacherId(initialData.lead_teacher_id || 'none');
      setColor(initialData.color || '#10b981');
      setIsActive(initialData.is_active !== false);
    } else {
      setName('');
      setDescription('');
      setAgeRangeMin('0');
      setAgeRangeMax('5');
      setRoomNumber('');
      setMaxCapacity('20');
      setLeadTeacherId('none');
      setColor('#10b981');
      setIsActive(true);
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Class name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please enter class name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateClassPayload | UpdateClassPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        age_range_min: parseInt(ageRangeMin, 10) || 0,
        age_range_max: parseInt(ageRangeMax, 10) || 12,
        room_number: roomNumber.trim() || undefined,
        max_capacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
        lead_teacher_id: leadTeacherId !== 'none' ? leadTeacherId : null,
        color,
        is_active: isActive,
      };

      await onSave(payload);
      toast.success(mode === 'create' ? 'Children class created.' : 'Class updated.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <School className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                {mode === 'create' ? 'Create Children Class' : 'Edit Class Details'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Configure age brackets, room numbers, student capacities, and lead teacher rosters.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            {/* Class Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Class Name *
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Kingdom Kids (Pre-K to 2nd)"
                className={errors.name ? 'border-red-500' : ''}
                autoFocus
              />
              {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Min Age (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="18"
                  value={ageRangeMin}
                  onChange={(e) => setAgeRangeMin(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Max Age (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="18"
                  value={ageRangeMax}
                  onChange={(e) => setAgeRangeMax(e.target.value)}
                />
              </div>
            </div>

            {/* Room & Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Room / Location
                </label>
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 104 (Kids Hall)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Max Capacity
                </label>
                <Input
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  placeholder="e.g. 20"
                />
              </div>
            </div>

            {/* Lead Teacher */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Lead Teacher / Coordinator
              </label>
              <Select value={leadTeacherId} onValueChange={setLeadTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned Lead</SelectItem>
                  {DEMO_MEMBERS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Description & Curriculum
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail age-appropriate activities, Bible stories, and teaching goals..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
              />
            </div>

            {/* Color Tag Picker */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Display Color Tag</span>
                <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: color }} />
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      color === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              isLoading={isSubmitting}
            >
              {mode === 'create' ? 'Create Class' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
