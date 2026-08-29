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
  Child,
  ChildrenClass,
  ChildGender,
  ChildStatus,
} from '@/types/database';
import { CreateChildPayload, UpdateChildPayload } from '@/services/childrenService';
import { DEMO_MEMBERS } from '@/lib/mockData';
import { Baby, Shield, AlertTriangle, User, Calendar, Phone, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface ChildFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateChildPayload | UpdateChildPayload) => Promise<void>;
  classes: ChildrenClass[];
  initialData?: Child | null;
  mode?: 'create' | 'edit';
  defaultClassId?: string;
  defaultParentId?: string;
}

export function ChildFormDialog({
  isOpen,
  onClose,
  onSave,
  classes,
  initialData,
  mode = 'create',
  defaultClassId,
  defaultParentId,
}: ChildFormDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<ChildGender>('male');
  const [parentGuardianId, setParentGuardianId] = useState<string>(defaultParentId || 'none');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [classId, setClassId] = useState<string>(defaultClassId || 'none');
  const [allergiesNotes, setAllergiesNotes] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [status, setStatus] = useState<ChildStatus>('active');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFirstName(initialData.first_name || '');
      setLastName(initialData.last_name || '');
      setDateOfBirth(initialData.date_of_birth || '');
      setGender(initialData.gender || 'male');
      setParentGuardianId(initialData.parent_guardian_id || 'none');
      setParentName(initialData.parent_name || '');
      setParentPhone(initialData.parent_phone || '');
      setParentEmail(initialData.parent_email || '');
      setEmergencyContactName(initialData.emergency_contact_name || '');
      setEmergencyContactPhone(initialData.emergency_contact_phone || '');
      setClassId(initialData.class_id || 'none');
      setAllergiesNotes(initialData.allergies_medical_notes || '');
      setSecurityPin(initialData.security_pin || '');
      setStatus(initialData.status || 'active');
      setNotes(initialData.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setDateOfBirth('2022-01-01');
      setGender('male');
      setParentGuardianId(defaultParentId || 'none');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setClassId(defaultClassId || (classes[0]?.id || 'none'));
      setAllergiesNotes('');
      setSecurityPin(`PIN-${Math.floor(1000 + Math.random() * 9000)}`);
      setStatus('active');
      setNotes('');
    }
    setErrors({});
  }, [initialData, mode, isOpen, defaultClassId, defaultParentId, classes]);

  const handleParentSelect = (pId: string) => {
    setParentGuardianId(pId);
    if (pId !== 'none') {
      const parent = DEMO_MEMBERS.find((m) => m.id === pId);
      if (parent) {
        setParentName(`${parent.profile?.first_name} ${parent.profile?.last_name}`);
        setParentPhone(parent.profile?.phone || '');
        setParentEmail(parent.profile?.email || '');
        if (!lastName) setLastName(parent.profile?.last_name || '');
        if (!emergencyContactName) {
          setEmergencyContactName(`${parent.profile?.first_name} ${parent.profile?.last_name} (Parent)`);
          setEmergencyContactPhone(parent.profile?.phone || '');
        }
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!parentName.trim() && parentGuardianId === 'none') {
      newErrors.parent = 'Please select a parent from directory or enter parent name';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateChildPayload | UpdateChildPayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        parent_guardian_id: parentGuardianId !== 'none' ? parentGuardianId : null,
        parent_name: parentName.trim(),
        parent_phone: parentPhone.trim() || null,
        parent_email: parentEmail.trim() || null,
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        class_id: classId !== 'none' ? classId : null,
        allergies_medical_notes: allergiesNotes.trim() || null,
        security_pin: securityPin.trim() || `PIN-${Math.floor(1000 + Math.random() * 9000)}`,
        status,
        notes: notes.trim() || null,
      };

      await onSave(payload);
      toast.success(mode === 'create' ? 'Child profile registered.' : 'Child profile updated.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save child profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Baby className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                {mode === 'create' ? 'Register Child (Kids Ministry)' : 'Edit Child Profile'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Secure child registration, emergency contacts, allergy tags, and security check-in PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Child Name & DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  First Name *
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                  }}
                  placeholder="e.g. Noah"
                  className={errors.firstName ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.firstName && <span className="text-[10px] text-red-500">{errors.firstName}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Last Name *
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                  }}
                  placeholder="e.g. Jenkins"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <span className="text-[10px] text-red-500">{errors.lastName}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                  }}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && <span className="text-[10px] text-red-500">{errors.dateOfBirth}</span>}
              </div>
            </div>

            {/* Gender, Class, Security PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Class Assignment
                </label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} (Ages {c.age_range_min}-{c.age_range_max})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Security Check-In PIN
                </label>
                <Input
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="PIN-1234"
                  className="font-mono font-bold"
                />
              </div>
            </div>

            {/* Parent / Guardian Section */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-600" />
                  Parent / Primary Guardian *
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium">
                    Link Church Member (Optional)
                  </label>
                  <Select value={parentGuardianId} onValueChange={handleParentSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from member directory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non-member / Guest parent</SelectItem>
                      {DEMO_MEMBERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium">
                    Parent Full Name *
                  </label>
                  <Input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className={errors.parent ? 'border-red-500' : ''}
                  />
                  {errors.parent && <span className="text-[10px] text-red-500">{errors.parent}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="Parent Phone Number"
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="Parent Email"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Emergency Contact Name
                </label>
                <Input
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Mark Jenkins (Father)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Emergency Phone Number
                </label>
                <Input
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+1 (555) 234-5679"
                />
              </div>
            </div>

            {/* Allergies & Medical Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Allergies, Dietary Restrictions & Medical Alerts
              </label>
              <Input
                value={allergiesNotes}
                onChange={(e) => setAllergiesNotes(e.target.value)}
                placeholder="e.g. Severe Peanut Allergy (EpiPen in bag), Lactose intolerant..."
                className="border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20"
              />
            </div>

            {/* Teacher Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Teacher Notes & Calming Preferences
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Favorite stuffed toy, naptime schedule, special needs notes..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              isLoading={isSubmitting}
            >
              {mode === 'create' ? 'Register Child' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
