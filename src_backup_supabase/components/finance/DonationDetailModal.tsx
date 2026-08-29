import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Donation, UserRole } from '@/types/database';
import { PAYMENT_METHODS } from '@/services/financeService';
import {
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Building,
  Printer,
  Edit2,
  Archive,
  Trash2,
  CheckCircle2,
  Receipt,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DonationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: Donation | null;
  onEdit: (donation: Donation) => void;
  onArchive: (donation: Donation) => void;
  onDelete: (donationId: string) => Promise<void>;
  currentUserRole?: UserRole | null;
}

export function DonationDetailModal({
  isOpen,
  onClose,
  donation,
  onEdit,
  onArchive,
  onDelete,
  currentUserRole,
}: DonationDetailModalProps) {
  if (!donation) return null;

  const canManage = ['super_admin', 'church_admin'].includes(currentUserRole || '');
  const methodObj = PAYMENT_METHODS.find((m) => m.value === donation.payment_method);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={donation.status === 'completed' ? 'emerald' : donation.status === 'archived' ? 'amber' : 'outline'} className="text-xs capitalize">
                {donation.status}
              </Badge>
              {donation.is_tax_deductible && (
                <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200">
                  Tax-Deductible
                </Badge>
              )}
            </div>

            <span className="text-xs font-mono text-slate-400">
              {donation.reference_number || donation.id}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
              ${Number(donation.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-slate-500">{donation.currency || 'INR'}</span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Designated for <strong className="text-slate-800 dark:text-slate-200 font-semibold">{donation.fund_name}</strong> on {formatDate(donation.donation_date)}
          </p>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Donor Information Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  {donation.donor_name[0] || 'D'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {donation.donor_name}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {donation.member_id ? 'Registered Church Member' : 'Guest / External Contributor'}
                  </span>
                </div>
              </div>

              {donation.member_id && (
                <Link
                  to={`/people/members/${donation.member_id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  Member Profile
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {(donation.donor_email || donation.donor_phone) && (
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500">
                {donation.donor_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {donation.donor_email}
                  </span>
                )}
                {donation.donor_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {donation.donor_phone}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Payment Method</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {methodObj?.label || donation.payment_method}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Reference / Check #</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                {donation.reference_number || 'None'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {donation.notes && (
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Memo & Accounting Notes</span>
              <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                {donation.notes}
              </p>
            </div>
          )}

          {/* Recorder Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Recorded by: <strong className="text-slate-600 dark:text-slate-300">{donation.recorded_by_name || 'Finance Staff'}</strong></span>
            <span>Created {formatDate(donation.created_at)}</span>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={handlePrintReceipt}
            >
              <Printer className="h-3.5 w-3.5" />
              Print Receipt
            </Button>

            {canManage && (
              <div className="flex items-center gap-2">
                {donation.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 gap-1"
                    onClick={() => onArchive(donation)}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive / Void
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => onEdit(donation)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-600 hover:bg-red-50 gap-1"
                  onClick={() => {
                    if (window.confirm('Permanently delete this donation transaction?')) {
                      onDelete(donation.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
