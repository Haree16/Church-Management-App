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
  YouthProfile,
  ChildGender,
  YouthStatus,
} from '@/types/database';
import { CreateYouthPayload, UpdateYouthPayload } from '@/services/youthService';
import { DEMO_GROUPS, DEMO_MEMBERS } from '@/lib/mockData';
import { Sparkles, User, GraduationCap, Phone, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';

interface YouthFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateYouthPayload | UpdateYouthPayload) => Promise<void>;
  initialData?: YouthProfile | null;
  mode?: 'create' | 'edit';
}

const GRADES = [
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade (Freshman)',
  '10th Grade (Sophomore)',
  '11th Grade (Junior)',
  '12th Grade (Senior)',
  'College / Young Adult',
];

export function YouthFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: YouthFormDialogProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('9th Grade (Freshman)');
  const [schoolName, setSchoolName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<ChildGender>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [baptismStatus, setBaptismStatus] = useState('not_baptized');
  const [mentorId, setMentorId] = useState<string>('none');
  const [groupId, setGroupId] = useState<string>('none');
  const [status, setStatus] = useState<YouthStatus>('active');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setGrade(initialData.grade || '9th Grade (Freshman)');
      setSchoolName(initialData.school_name || '');
      setDateOfBirth(initialData.date_of_birth || '');
      setGender(initialData.gender || 'male');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setParentName(initialData.parent_name || '');
      setParentPhone(initialData.parent_phone || '');
      setEmergencyContact(initialData.emergency_contact || '');
      setBaptismStatus(initialData.baptism_status || 'not_baptized');
      setMentorId(initialData.mentor_id || 'none');
      setGroupId(initialData.group_id || 'none');
      setStatus(initialData.status || 'active');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setGrade('9th Grade (Freshman)');
      setSchoolName('');
      setDateOfBirth('2009-01-01');
      setGender('male');
      setPhone('');
      setEmail('');
      setParentName('');
      setParentPhone('');
      setEmergencyContact('');
      setBaptismStatus('not_baptized');
      setMentorId('none');
      setGroupId('none');
      setStatus('active');
      setNotes('');
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Student full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please enter student name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateYouthPayload | UpdateYouthPayload = {
        name: name.trim(),
        grade,
        school_name: schoolName.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        parent_name: parentName.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        baptism_status: baptismStatus,
        mentor_id: mentorId !== 'none' ? mentorId : null,
        group_id: groupId !== 'none' ? groupId : null,
        status,
        notes: notes.trim() || undefined,
      };

      await onSave(payload);
      toast.success(mode === 'create' ? 'Youth student registered.' : 'Youth profile updated.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save youth profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                {mode === 'create' ? 'Register Youth Student' : 'Edit Youth Profile'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Student ministry discipleship, mentorship pairing, school info, and emergency contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Student Name & Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Student Full Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Caleb Anderson"
                  className={errors.name ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Grade Level
                </label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* School & DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  School / Campus
                </label>
                <Input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Westlake High"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Gender
                </label>
                <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Student Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 789-1001"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Student Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
            </div>

            {/* Parent & Emergency Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-600" />
                Parent & Emergency Contacts
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Parent / Guardian Name"
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Parent Phone Number"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Secondary Emergency Contact & Phone"
                />
              </div>
            </div>

            {/* Mentorship & Small Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Youth Mentor / Leader
                </label>
                <Select value={mentorId} onValueChange={setMentorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Mentor Assigned</SelectItem>
                    {DEMO_MEMBERS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Youth Small Group / Crew
                </label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Small Group</SelectItem>
                    {DEMO_GROUPS.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Baptism Status & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Spiritual Milestones / Baptism
                </label>
                <Select value={baptismStatus} onValueChange={setBaptismStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Baptism" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baptized">Water Baptized</SelectItem>
                    <SelectItem value="interested">Interested in Baptism Class</SelectItem>
                    <SelectItem value="not_baptized">Not Yet Baptized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Enrollment Status
                </label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Student</SelectItem>
                    <SelectItem value="graduated">Graduated (Alumni)</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Leader Notes & Ministry Interests
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Serves on worship band, interested in mission trip, hobbies..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              isLoading={isSubmitting}
            >
              {mode === 'create' ? 'Register Student' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
