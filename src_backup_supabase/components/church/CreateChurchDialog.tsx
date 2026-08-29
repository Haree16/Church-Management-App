import React, { useState } from 'react';
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
import { Church } from '@/types/database';
import { CreateChurchPayload } from '@/services/churchService';
import { Building2, Globe, Mail, Phone, MapPin, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateChurchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newChurch: Church) => void;
  onCreate: (payload: CreateChurchPayload) => Promise<Church>;
}

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST - Chennai, Kolkata, Mumbai, Delhi)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong' },
  { value: 'Europe/London', label: 'London, GMT / BST' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
];

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
  { value: 'SGD', label: 'SGD ($) - Singapore Dollar' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
];

export function CreateChurchDialog({
  isOpen,
  onClose,
  onSuccess,
  onCreate,
}: CreateChurchDialogProps) {
  const [formData, setFormData] = useState<CreateChurchPayload>({
    name: '',
    tagline: '',
    logo_url: '',
    email: '',
    phone: '',
    website: '',
    address: 'No. 12, Mount Road, Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postal_code: '600002',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateChurchPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Church name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await onCreate(formData);
      toast.success(`Church "${created.name}" created successfully!`);
      // Reset form
      setFormData({
        name: '',
        tagline: '',
        logo_url: '',
        email: '',
        phone: '',
        website: '',
        address: 'No. 12, Mount Road, Anna Salai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postal_code: '600002',
        country: 'India',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
      });
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create church:', err);
      toast.error(err.message || 'Failed to create church. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-600">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Create New Church
              </DialogTitle>
              <DialogDescription className="text-xs">
                Register a new independent church or campus tenant with its own members, ministries, and events.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Section: Church Profile */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              General Information
            </h4>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Church / Campus Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Living Hope Community Church"
                  required
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Motto / Tagline
                </label>
                <Input
                  value={formData.tagline || ''}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="e.g. Loving God, Loving People, Serving the World"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Logo URL (optional)
                </label>
                <Input
                  value={formData.logo_url || ''}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  placeholder="https://.../logo.png"
                  icon={<ImageIcon className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>

          {/* Section: Contact & Location */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Location & Contact Details
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Official Email
                </label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contact@church.org"
                  icon={<Mail className="h-4 w-4" />}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-[11px] text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Website
                </label>
                <Input
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourchurch.org"
                  icon={<Globe className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Street Address
                </label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Faith Avenue"
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Dallas"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    State / Prov.
                  </label>
                  <Input
                    value={formData.state || ''}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="TX"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Postal Code
                  </label>
                  <Input
                    value={formData.postal_code || ''}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="75001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Regional Preferences */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Localization & Settings
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Timezone
                </label>
                <Select
                  value={formData.timezone || 'America/Chicago'}
                  onValueChange={(val) => handleInputChange('timezone', val)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency
                </label>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(val) => handleInputChange('currency', val)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((cur) => (
                      <SelectItem key={cur.value} value={cur.value}>
                        {cur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Auto Admin Note */}
          <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <span className="font-semibold">Automatic Administrator Access:</span> You will automatically become the <strong>Church Admin</strong> for this new church with full permissions to manage members, services, and finances.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="h-9 gap-1.5 text-xs bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Create Church
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
