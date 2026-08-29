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
import { Badge } from '@/components/ui/badge';
import { Sparkles, UserPlus, Check, X, ShieldCheck } from 'lucide-react';
import { Volunteer, ChurchMember, VolunteerStatus } from '@/types/database';
import {
  CreateVolunteerPayload,
  SKILL_OPTIONS,
  AVAILABILITY_OPTIONS,
  PREFERRED_SERVICES,
} from '@/services/volunteerService';
import { toast } from 'sonner';

interface VolunteerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateVolunteerPayload) => Promise<void>;
  initialData?: Volunteer | null;
  availableMembers: ChurchMember[];
  mode?: 'create' | 'edit';
}

export function VolunteerFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableMembers = [],
  mode = 'create',
}: VolunteerFormDialogProps) {
  const [memberId, setMemberId] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>(['Sunday Morning 09:00 AM (Traditional)']);
  const [preferredService, setPreferredService] = useState(PREFERRED_SERVICES[0]);
  const [status, setStatus] = useState<VolunteerStatus>('active');
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState('approved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setMemberId(initialData.member_id || '');
      setSkills(initialData.skills || []);
      setAvailability(initialData.availability || []);
      setPreferredService(initialData.preferred_service || PREFERRED_SERVICES[0]);
      setStatus(initialData.status || 'active');
      setBackgroundCheckStatus(initialData.background_check_status || 'approved');
      setNotes(initialData.notes || '');
    } else {
      setMemberId('');
      setSkills(['Greeting & Welcome Team']);
      setAvailability(['Sunday Morning 09:00 AM (Traditional)']);
      setPreferredService(PREFERRED_SERVICES[0]);
      setStatus('active');
      setBackgroundCheckStatus('approved');
      setNotes('');
    }
  }, [initialData, isOpen]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !skills.includes(customSkillInput.trim())) {
      setSkills([...skills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const toggleAvailability = (avail: string) => {
    setAvailability((prev) =>
      prev.includes(avail) ? prev.filter((a) => a !== avail) : [...prev, avail]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      toast.error('Please select a church member to onboard as a volunteer');
      return;
    }
    if (skills.length === 0) {
      toast.error('Please select at least one volunteer skill or area of service');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        member_id: memberId,
        skills,
        availability,
        preferred_service: preferredService,
        status,
        background_check_status: backgroundCheckStatus,
        notes: notes.trim() || undefined,
      });
      toast.success(mode === 'create' ? 'Volunteer onboarded successfully!' : 'Volunteer profile updated');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save volunteer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-sky-600" />
              {mode === 'create' ? 'Onboard Church Volunteer' : 'Edit Volunteer Profile'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register ministry skills, availability preferences, and background checks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 1. Member Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Covenant Member *
              </label>
              {mode === 'create' ? (
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a church member..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.profile?.display_name || m.profile?.email} ({m.membership_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 px-3 flex items-center bg-slate-50 border rounded-md text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {initialData?.profile?.display_name || initialData?.profile?.email || 'Member'}
                </div>
              )}
            </div>

            {/* 2. Skills Tag Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Service Skills & Department Gifts * ({skills.length} selected)
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 font-medium'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="Add custom skill or specialty..."
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomSkill}
                  className="h-8 text-xs"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* 3. Availability Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Service Shift Availability
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map((avail) => {
                  const isChecked = availability.includes(avail);
                  return (
                    <div
                      key={avail}
                      onClick={() => toggleAvailability(avail)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-sky-50/70 border-sky-300 text-sky-900 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-200 font-medium'
                          : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                      }`}
                    >
                      <span>{avail}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-sky-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Preferred Service & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preferred Service
                </label>
                <Select value={preferredService} onValueChange={setPreferredService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Preferred Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFERRED_SERVICES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Volunteer Status
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val as VolunteerStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Roster</SelectItem>
                    <SelectItem value="pending">Pending Onboarding</SelectItem>
                    <SelectItem value="inactive">Inactive / On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5. Background Check & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Background Check Status
                </label>
                <Select value={backgroundCheckStatus} onValueChange={setBackgroundCheckStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Background Check" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved / Verified</SelectItem>
                    <SelectItem value="pending">Pending Background Check</SelectItem>
                    <SelectItem value="not_required">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pastoral / Team Notes
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Completed child safety training..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
              {mode === 'create' ? 'Onboard Volunteer' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
