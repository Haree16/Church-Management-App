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
  Donation,
  DonationFund,
  PaymentMethod,
} from '@/types/database';
import {
  PAYMENT_METHODS,
  CreateDonationPayload,
  UpdateDonationPayload,
} from '@/services/financeService';
import { DEMO_MEMBERS, DEMO_VISITORS } from '@/lib/mockData';
import { DollarSign, User, Calendar, CreditCard, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface DonationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateDonationPayload | UpdateDonationPayload) => Promise<void>;
  funds: DonationFund[];
  initialData?: Donation | null;
  mode?: 'create' | 'edit';
  defaultMemberId?: string;
}

export function DonationFormDialog({
  isOpen,
  onClose,
  onSave,
  funds,
  initialData,
  mode = 'create',
  defaultMemberId,
}: DonationFormDialogProps) {
  const [donorType, setDonorType] = useState<'member' | 'guest' | 'anonymous'>('member');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(defaultMemberId || null);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [fundName, setFundName] = useState<string>('Tithe');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (funds.length > 0 && !fundId) {
      const def = funds.find((f) => f.is_default) || funds[0];
      setFundId(def.id);
      setFundName(def.name);
    }
  }, [funds]);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      if (initialData.member_id) {
        setDonorType('member');
        setSelectedMemberId(initialData.member_id);
      } else if (initialData.donor_name.toLowerCase().includes('anonymous')) {
        setDonorType('anonymous');
      } else {
        setDonorType('guest');
      }
      setDonorName(initialData.donor_name || '');
      setDonorEmail(initialData.donor_email || '');
      setDonorPhone(initialData.donor_phone || '');
      setAmount(String(initialData.amount || ''));
      setFundId(initialData.fund_id || '');
      setFundName(initialData.fund_name || 'Tithe');
      setPaymentMethod((initialData.payment_method as PaymentMethod) || 'card');
      setReferenceNumber(initialData.reference_number || '');
      setDonationDate(initialData.donation_date || new Date().toISOString().split('T')[0]);
      setIsTaxDeductible(initialData.is_tax_deductible !== false);
      setNotes(initialData.notes || '');
    } else {
      if (defaultMemberId) {
        setDonorType('member');
        setSelectedMemberId(defaultMemberId);
        const mem = DEMO_MEMBERS.find((m) => m.id === defaultMemberId);
        if (mem) {
          setDonorName(`${mem.profile?.first_name} ${mem.profile?.last_name}`);
          setDonorEmail(mem.profile?.email || '');
          setDonorPhone(mem.profile?.phone || '');
        }
      } else {
        setDonorType('member');
        setSelectedMemberId(null);
        setDonorName('');
        setDonorEmail('');
        setDonorPhone('');
      }
      setAmount('');
      const def = funds.find((f) => f.is_default) || funds[0];
      if (def) {
        setFundId(def.id);
        setFundName(def.name);
      }
      setPaymentMethod('card');
      setReferenceNumber(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
      setDonationDate(new Date().toISOString().split('T')[0]);
      setIsTaxDeductible(true);
      setNotes('');
    }
    setErrors({});
  }, [initialData, mode, isOpen, defaultMemberId, funds]);

  const handleMemberSelect = (memId: string) => {
    setSelectedMemberId(memId === 'none' ? null : memId);
    const mem = DEMO_MEMBERS.find((m) => m.id === memId);
    if (mem) {
      setDonorName(`${mem.profile?.first_name} ${mem.profile?.last_name}`.trim());
      setDonorEmail(mem.profile?.email || '');
      setDonorPhone(mem.profile?.phone || '');
      if (errors.donor) setErrors((prev) => ({ ...prev, donor: '' }));
    }
  };

  const handleFundChange = (fId: string) => {
    setFundId(fId);
    const f = funds.find((item) => item.id === fId);
    if (f) {
      setFundName(f.name);
      setIsTaxDeductible(f.is_tax_deductible);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      newErrors.amount = 'Please enter a valid donation amount greater than 0';
    }
    if (donorType === 'member' && !selectedMemberId) {
      newErrors.donor = 'Please select a church member';
    }
    if (donorType === 'guest' && !donorName.trim()) {
      newErrors.donor = 'Please enter donor name';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors.');
      return;
    }

    let finalName = donorName.trim();
    if (donorType === 'anonymous') {
      finalName = 'Anonymous Donor';
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: CreateDonationPayload = {
          member_id: donorType === 'member' ? selectedMemberId : null,
          fund_id: fundId || null,
          fund_name: fundName,
          donor_name: finalName,
          donor_email: donorType !== 'anonymous' ? donorEmail.trim() || null : null,
          donor_phone: donorType !== 'anonymous' ? donorPhone.trim() || null : null,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim() || null,
          donation_date: donationDate,
          is_tax_deductible: isTaxDeductible,
          notes: notes.trim() || null,
        };
        await onSave(payload);
        toast.success('Donation transaction recorded successfully.');
      } else {
        const payload: UpdateDonationPayload = {
          member_id: donorType === 'member' ? selectedMemberId : null,
          fund_id: fundId || null,
          fund_name: fundName,
          donor_name: finalName,
          donor_email: donorType !== 'anonymous' ? donorEmail.trim() || null : null,
          donor_phone: donorType !== 'anonymous' ? donorPhone.trim() || null : null,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim() || null,
          donation_date: donationDate,
          is_tax_deductible: isTaxDeductible,
          notes: notes.trim() || null,
        };
        await onSave(payload);
        toast.success('Donation transaction updated.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
              <DialogTitle className="text-lg">
                {mode === 'create' ? 'Record Donation / Contribution' : 'Edit Donation Transaction'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Log financial gifts, tithes, building pledges, missions contributions, and cash envelopes.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Donor Type Switcher */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-600" />
                  Donor Identification *
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDonorType('member')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      donorType === 'member'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Church Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorType('guest')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      donorType === 'guest'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Guest / Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonorType('anonymous')}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      donorType === 'anonymous'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    Anonymous
                  </button>
                </div>
              </div>

              {donorType === 'member' && (
                <div className="space-y-1">
                  <Select
                    value={selectedMemberId || 'none'}
                    onValueChange={handleMemberSelect}
                  >
                    <SelectTrigger className={errors.donor ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select Church Member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select member from directory...</SelectItem>
                      {DEMO_MEMBERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`} ({m.membership_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.donor && <span className="text-[10px] text-red-500">{errors.donor}</span>}
                </div>
              )}

              {donorType === 'guest' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Input
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Donor Full Name *"
                      className={errors.donor ? 'border-red-500' : ''}
                    />
                    {errors.donor && <span className="text-[10px] text-red-500">{errors.donor}</span>}
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="Email for tax receipt"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              )}

              {donorType === 'anonymous' && (
                <div className="text-xs text-slate-500 bg-white dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                  Transaction will be recorded as <strong>Anonymous Donor</strong> (e.g. loose cash plate collection).
                </div>
              )}
            </div>

            {/* Amount & Designated Fund Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Contribution Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                    }}
                    placeholder="1000.00"
                    className={`pl-7 font-mono font-bold text-sm ${errors.amount ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                </div>
                {errors.amount && <span className="text-[10px] text-red-500">{errors.amount}</span>}
              </div>

              {/* Designated Fund */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Designated Accounting Fund *
                </label>
                <Select value={fundId} onValueChange={handleFundChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {funds.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color || '#0284c7' }} />
                          <span>{f.name}</span>
                          <span className="text-[10px] text-slate-400">({f.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method, Date, Reference Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Payment Method */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method *
                </label>
                <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Donation Date */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Transaction Date *
                </label>
                <Input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>

              {/* Reference / Check # */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Ref / Check # / Receipt
                </label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. CHK-1049 or TXN-998"
                />
              </div>
            </div>

            {/* Tax Deductible Toggle & Notes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Tax-Deductible Contribution (Included in Annual Donor Tax Statements)
                </span>
              </label>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Memo & Internal Accounting Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. In memory of Pastor Davis, Sunday envelope #412..."
                  rows={2}
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              isLoading={isSubmitting}
            >
              {mode === 'create' ? 'Record Donation' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
