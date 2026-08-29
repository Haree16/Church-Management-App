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
import {
  DonationFund,
  PaymentMethod,
} from '@/types/database';
import {
  PAYMENT_METHODS,
  CreateDonationPayload,
} from '@/services/financeService';
import { DEMO_MEMBERS } from '@/lib/mockData';
import { Plus, Trash2, Layers, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface BatchDonationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (payloads: CreateDonationPayload[]) => Promise<void>;
  funds: DonationFund[];
}

interface BatchRow {
  id: string;
  memberId: string | null;
  donorName: string;
  amount: string;
  fundId: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
}

export function BatchDonationDialog({
  isOpen,
  onClose,
  onSaveBatch,
  funds,
}: BatchDonationDialogProps) {
  const defaultFund = funds.find((f) => f.is_default) || funds[0];
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<BatchRow[]>([
    {
      id: 'row-1',
      memberId: null,
      donorName: '',
      amount: '',
      fundId: defaultFund?.id || 'fund-1',
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
    },
    {
      id: 'row-2',
      memberId: null,
      donorName: '',
      amount: '',
      fundId: defaultFund?.id || 'fund-1',
      paymentMethod: 'cheque',
      referenceNumber: '',
      notes: '',
    },
    {
      id: 'row-3',
      memberId: null,
      donorName: '',
      amount: '',
      fundId: defaultFund?.id || 'fund-1',
      paymentMethod: 'cash',
      referenceNumber: '',
      notes: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length}`,
        memberId: null,
        donorName: '',
        amount: '',
        fundId: defaultFund?.id || 'fund-1',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    if (rows.length === 1) {
      toast.error('Batch must have at least 1 entry row.');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateRow = (idx: number, field: keyof BatchRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'memberId') {
        const mem = DEMO_MEMBERS.find((m) => m.id === value);
        if (mem) {
          copy[idx].donorName = `${mem.profile?.first_name} ${mem.profile?.last_name}`.trim();
        }
      }
      return copy;
    });
  };

  const totalBatchAmount = rows.reduce((sum, r) => {
    const n = parseFloat(r.amount);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const validRowCount = rows.filter((r) => parseFloat(r.amount) > 0 && r.donorName.trim()).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRows = rows.filter((r) => parseFloat(r.amount) > 0 && r.donorName.trim());
    if (validRows.length === 0) {
      toast.error('Please enter at least one donation with donor name and valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloads: CreateDonationPayload[] = validRows.map((r) => {
        const fundObj = funds.find((f) => f.id === r.fundId);
        return {
          member_id: r.memberId || null,
          fund_id: r.fundId,
          fund_name: fundObj?.name || 'Tithe',
          donor_name: r.donorName.trim(),
          amount: parseFloat(r.amount),
          payment_method: r.paymentMethod,
          reference_number: r.referenceNumber.trim() || `BATCH-${Math.floor(100000 + Math.random() * 900000)}`,
          donation_date: batchDate,
          is_tax_deductible: fundObj ? fundObj.is_tax_deductible : true,
          notes: r.notes.trim() || 'Sunday Batch Entry',
        };
      });

      await onSaveBatch(payloads);
      toast.success(`Successfully recorded batch of ${payloads.length} donations ($${totalBatchAmount.toFixed(2)} total).`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit batch donations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Layers className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">Fast Batch Donation Entry</DialogTitle>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span>Batch Total: ${totalBatchAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <DialogDescription className="text-xs">
              Rapid grid entry for Sunday offering envelopes, cash collections, and counting teams.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Batch Date Header */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Batch Collection Date:</span>
              <Input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="w-44 h-8 text-xs bg-white dark:bg-slate-800"
              />
              <span className="text-slate-400">
                {validRowCount} valid entries ready
              </span>
            </div>

            {/* Batch Rows Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2 pl-3 text-left w-8">#</th>
                    <th className="p-2 text-left w-52">Member / Donor</th>
                    <th className="p-2 text-left w-36">Fund</th>
                    <th className="p-2 text-left w-28">Amount ($)</th>
                    <th className="p-2 text-left w-32">Method</th>
                    <th className="p-2 text-left w-28">Check / Ref #</th>
                    <th className="p-2 text-left">Memo</th>
                    <th className="p-2 pr-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2 pl-3 font-mono text-slate-400 text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Member / Donor */}
                      <td className="p-2">
                        <Select
                          value={row.memberId || (row.donorName === 'Anonymous Donor' ? 'anonymous' : 'custom')}
                          onValueChange={(val) => {
                            if (val === 'anonymous') {
                              handleUpdateRow(idx, 'memberId', null);
                              handleUpdateRow(idx, 'donorName', 'Anonymous Donor');
                            } else if (val === 'custom') {
                              handleUpdateRow(idx, 'memberId', null);
                              handleUpdateRow(idx, 'donorName', '');
                            } else {
                              handleUpdateRow(idx, 'memberId', val);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select Member or Enter Name" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="anonymous">Anonymous Plate Collection</SelectItem>
                            <SelectItem value="custom">Manual Donor Name</SelectItem>
                            {DEMO_MEMBERS.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {!row.memberId && row.donorName !== 'Anonymous Donor' && (
                          <Input
                            value={row.donorName}
                            onChange={(e) => handleUpdateRow(idx, 'donorName', e.target.value)}
                            placeholder="Enter Donor Name"
                            className="h-6 text-[11px] mt-1"
                          />
                        )}
                      </td>

                      {/* Fund */}
                      <td className="p-2">
                        <Select
                          value={row.fundId}
                          onValueChange={(val) => handleUpdateRow(idx, 'fundId', val)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Select Fund" />
                          </SelectTrigger>
                          <SelectContent>
                            {funds.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Amount */}
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={row.amount}
                          onChange={(e) => handleUpdateRow(idx, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="h-7 text-xs font-mono font-bold text-right"
                        />
                      </td>

                      {/* Payment Method */}
                      <td className="p-2">
                        <Select
                          value={row.paymentMethod}
                          onValueChange={(val) => handleUpdateRow(idx, 'paymentMethod', val as PaymentMethod)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label.split(' ')[0]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Reference # */}
                      <td className="p-2">
                        <Input
                          value={row.referenceNumber}
                          onChange={(e) => handleUpdateRow(idx, 'referenceNumber', e.target.value)}
                          placeholder="CHK / ENV #"
                          className="h-7 text-xs font-mono"
                        />
                      </td>

                      {/* Notes */}
                      <td className="p-2">
                        <Input
                          value={row.notes}
                          onChange={(e) => handleUpdateRow(idx, 'notes', e.target.value)}
                          placeholder="Optional memo"
                          className="h-7 text-xs"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 pr-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveRow(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 border-dashed w-full"
              onClick={handleAddRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Another Offering Envelope Row
            </Button>
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
              Submit Batch ({validRowCount} Contributions • ${totalBatchAmount.toFixed(2)})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
