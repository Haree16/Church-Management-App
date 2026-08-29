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
import { Family, ChurchMember } from '@/types/database';
import { CreateFamilyPayload } from '@/services/familyService';
import { HeartHandshake, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'sonner';

interface FamilyFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateFamilyPayload) => Promise<void>;
  initialData?: Family | null;
  availableMembers?: ChurchMember[];
  mode?: 'create' | 'edit';
}

export function FamilyFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableMembers = [],
  mode = 'create',
}: FamilyFormDialogProps) {
  const [formData, setFormData] = useState<CreateFamilyPayload>({
    family_name: '',
    primary_contact_id: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        family_name: initialData.family_name || '',
        primary_contact_id: initialData.primary_contact_id || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postal_code: initialData.postal_code || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        family_name: '',
        primary_contact_id: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        notes: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.family_name.trim()) {
      setError('Family name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save family record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-sky-600" />
              {mode === 'create' ? 'Create Family Household' : 'Edit Family Details'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Group congregation members into a shared household record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Family / Household Name *
              </label>
              <Input
                value={formData.family_name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, family_name: e.target.value }));
                  setError('');
                }}
                placeholder="e.g. Jenkins Household"
                className={error ? 'border-red-500' : ''}
              />
              {error && <span className="text-[10px] text-red-500">{error}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Head of Household / Primary Contact
              </label>
              <Select
                value={formData.primary_contact_id || 'none'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    primary_contact_id: val === 'none' ? undefined : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Not Assigned</SelectItem>
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
                Household Phone
              </label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Home Address
              </label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="4502 Evergreen Terrace"
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Chennai"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  State / Postal
                </label>
                <Input
                  value={formData.state || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="Tamil Nadu 600002"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Household Notes
              </label>
              <Input
                value={formData.notes || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Joined after welcome track..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Family' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
