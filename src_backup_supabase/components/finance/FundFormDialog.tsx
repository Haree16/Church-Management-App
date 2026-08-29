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
import { DonationFund } from '@/types/database';
import { CreateFundPayload, UpdateFundPayload } from '@/services/financeService';
import { Wallet, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface FundFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateFundPayload | UpdateFundPayload) => Promise<void>;
  initialData?: DonationFund | null;
  mode?: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Rose Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#64748b', // Slate Gray
  '#ef4444', // Red
  '#f97316', // Orange
];

export function FundFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: FundFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isTaxDeductible, setIsTaxDeductible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setDescription(initialData.description || '');
      setTargetAmount(initialData.target_amount ? String(initialData.target_amount) : '');
      setColor(initialData.color || '#0284c7');
      setIsDefault(!!initialData.is_default);
      setIsActive(initialData.is_active !== false);
      setIsTaxDeductible(initialData.is_tax_deductible !== false);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setTargetAmount('');
      setColor('#0284c7');
      setIsDefault(false);
      setIsActive(true);
      setIsTaxDeductible(true);
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (mode === 'create' && (!code || code === name.toUpperCase().replace(/[^A-Z0-9]/g, '_'))) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15));
    }
    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Fund name is required';
    if (!code.trim()) newErrors.code = 'Fund accounting code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please enter required fund details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFundPayload | UpdateFundPayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        target_amount: targetAmount ? parseFloat(targetAmount) : null,
        color,
        is_default: isDefault,
        is_active: isActive,
        is_tax_deductible: isTaxDeductible,
      };

      await onSave(payload);
      toast.success(mode === 'create' ? 'Accounting fund created.' : 'Fund updated.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save fund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Wallet className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">
                {mode === 'create' ? 'Create Accounting Fund' : 'Edit Accounting Fund'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Configure designated church accounts, annual budget targets, and chart of accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5 text-xs">
            {/* Fund Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Fund Name *
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Building Expansion Fund"
                className={errors.name ? 'border-red-500' : ''}
                autoFocus
              />
              {errors.name && <span className="text-[10px] text-red-500">{errors.name}</span>}
            </div>

            {/* Code & Target Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Accounting Code *
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BUILDING"
                  className={errors.code ? 'border-red-500 font-mono' : 'font-mono'}
                />
                {errors.code && <span className="text-[10px] text-red-500">{errors.code}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Annual Budget Target ($)
                </label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Description & Designated Purpose
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail what this fund finances and donor restriction stipulations..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800"
              />
            </div>

            {/* Color Tag Picker */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Display Color Badge</span>
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

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Set as <strong>Default Fund</strong> for general tithes & offerings
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Contributions to this fund are <strong>Tax-Deductible</strong>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Active (accepting contributions)
                </span>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Fund' : 'Save Fund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
