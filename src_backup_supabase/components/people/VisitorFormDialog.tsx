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
import { Visitor, VisitorStatus, Profile } from '@/types/database';
import { CreateVisitorPayload } from '@/services/visitorService';
import { DEMO_USERS, DEMO_SETTINGS } from '@/lib/mockData';
import { UserCheck, Phone, Mail, MapPin, Calendar, Heart, MessageSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface VisitorFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateVisitorPayload) => Promise<void>;
  initialData?: Visitor | null;
  mode?: 'create' | 'edit';
}

export function VisitorFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: VisitorFormDialogProps) {
  const [formData, setFormData] = useState<CreateVisitorPayload>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    visit_date: new Date().toISOString().split('T')[0],
    service_attended: DEMO_SETTINGS.service_timings[0]?.name || 'Sunday Morning Service',
    invited_by: '',
    heard_about: 'Friend / Family',
    family_size: 1,
    prayer_request: '',
    notes: '',
    status: 'new',
    assigned_to: '',
    create_follow_up: true,
    follow_up_title: '',
    follow_up_due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        visit_date: initialData.visit_date || '',
        service_attended: initialData.service_attended || '',
        invited_by: initialData.invited_by || '',
        heard_about: initialData.heard_about || 'Friend / Family',
        family_size: initialData.family_size || 1,
        prayer_request: initialData.prayer_request || '',
        notes: initialData.notes || '',
        status: initialData.status || 'new',
        assigned_to: initialData.assigned_to || '',
        create_follow_up: false,
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        visit_date: new Date().toISOString().split('T')[0],
        service_attended: DEMO_SETTINGS.service_timings[0]?.name || 'Sunday Morning Service',
        invited_by: '',
        heard_about: 'Friend / Family',
        family_size: 1,
        prayer_request: '',
        notes: '',
        status: 'new',
        assigned_to: DEMO_USERS[1]?.id || '',
        create_follow_up: true,
        follow_up_title: '',
        follow_up_due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (field: keyof CreateVisitorPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.visit_date) newErrors.visit_date = 'Visit date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete required visitor fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save guest record.');
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
              <UserCheck className="h-5 w-5 text-sky-600" />
              {mode === 'create' ? 'Record Sunday Guest Connection' : 'Edit Visitor Record'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log connection card details and automate follow-up workflows for first-time visitors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  First Name *
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="e.g. Michael"
                  className={errors.first_name ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Last Name *
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="e.g. Taylor"
                  className={errors.last_name ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
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
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="michael@example.com"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Visit Date *
                </label>
                <Input
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => handleChange('visit_date', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Service Attended
                </label>
                <Select
                  value={formData.service_attended || 'default'}
                  onValueChange={(val) => handleChange('service_attended', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_SETTINGS.service_timings.map((st) => (
                      <SelectItem key={st.id} value={`${st.name} (${st.time})`}>
                        {st.name} ({st.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  How Did They Hear About Us?
                </label>
                <Select
                  value={formData.heard_about || 'Friend / Family'}
                  onValueChange={(val) => handleChange('heard_about', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Friend / Family">Friend or Family</SelectItem>
                    <SelectItem value="Social Media / Instagram">Social Media / Instagram / FB</SelectItem>
                    <SelectItem value="Church Website / Google Search">Google / Website</SelectItem>
                    <SelectItem value="Drive By / Neighborhood Sign">Drove By / Neighborhood</SelectItem>
                    <SelectItem value="Community Outreach Event">Community Outreach Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Invited By (Member Name)
                </label>
                <Input
                  value={formData.invited_by || ''}
                  onChange={(e) => handleChange('invited_by', e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Family / Party Size
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.family_size || 1}
                  onChange={(e) => handleChange('family_size', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Follow-up Status
                </label>
                <Select
                  value={formData.status || 'new'}
                  onValueChange={(val) => handleChange('status', val as VisitorStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="became_member">Became Member</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Pastoral Leader
                </label>
                <Select
                  value={formData.assigned_to || 'none'}
                  onValueChange={(val) => handleChange('assigned_to', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leader for follow-up" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Unassigned</SelectItem>
                    {DEMO_USERS.filter((u) => u.role !== 'member').map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prayer Request (From Guest Card)
                </label>
                <textarea
                  value={formData.prayer_request || ''}
                  onChange={(e) => handleChange('prayer_request', e.target.value)}
                  placeholder="Enter any prayer requests or spiritual questions submitted on the card..."
                  rows={2}
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Staff Notes & Observations
                </label>
                <Input
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="e.g. Interested in young adults small groups and children's church."
                />
              </div>
            </div>

            {/* Automated Follow-up Trigger */}
            {mode === 'create' && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs dark:border-sky-900/60 dark:bg-sky-950/20">
                <label className="flex items-center gap-2 font-semibold text-sky-950 dark:text-sky-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.create_follow_up}
                    onChange={(e) => handleChange('create_follow_up', e.target.checked)}
                    className="h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Automatically generate Follow-up Task for pastoral team</span>
                </label>
                {formData.create_follow_up && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2 border-t border-sky-200/60 dark:border-sky-900/40">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500">Task Title</span>
                      <Input
                        value={formData.follow_up_title || `Welcome call with ${formData.first_name || 'Guest'}`}
                        onChange={(e) => handleChange('follow_up_title', e.target.value)}
                        className="h-7 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500">Due Date</span>
                      <Input
                        type="date"
                        value={formData.follow_up_due_date || ''}
                        onChange={(e) => handleChange('follow_up_due_date', e.target.value)}
                        className="h-7 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Save Guest Record' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
