import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DonationFund, ChurchMember } from '@/types/database';
import { financeService, MemberGivingStatement } from '@/services/financeService';
import { DEMO_MEMBERS, DEMO_CHURCH } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { Printer, Download, FileText, Calendar, Building, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';

interface GivingStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  funds: DonationFund[];
  defaultMemberId?: string | null;
}

export function GivingStatementModal({
  isOpen,
  onClose,
  churchId,
  funds,
  defaultMemberId,
}: GivingStatementModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(defaultMemberId || 'cm-001');
  const [dateRangePreset, setDateRangePreset] = useState<'2026_ytd' | '2025_full' | 'custom'>('2026_ytd');
  const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFundId, setSelectedFundId] = useState<string>('all');
  const [statement, setStatement] = useState<MemberGivingStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetChange = (preset: '2026_ytd' | '2025_full' | 'custom') => {
    setDateRangePreset(preset);
    const currYear = new Date().getFullYear();
    if (preset === '2026_ytd') {
      setStartDate(`${currYear}-01-01`);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (preset === '2025_full') {
      setStartDate(`${currYear - 1}-01-01`);
      setEndDate(`${currYear - 1}-12-31`);
    }
  };

  const loadStatement = async () => {
    if (!selectedMemberId) return;
    setIsLoading(true);
    try {
      const data = await financeService.generateMemberStatement(
        churchId,
        selectedMemberId,
        startDate,
        endDate,
        selectedFundId
      );
      setStatement(data);
    } catch (err: any) {
      console.error('Failed to generate giving statement:', err);
      toast.error('Failed to generate giving statement.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedMemberId) {
      loadStatement();
    }
  }, [isOpen, selectedMemberId, startDate, endDate, selectedFundId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Controls Toolbar (Hidden during print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 print:hidden space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-base">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span>Official Donor Giving Statement Generator</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Member Selector */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Member / Donor
              </label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_MEMBERS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.profile?.display_name || `${m.profile?.first_name} ${m.profile?.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Preset */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Period Preset
              </label>
              <Select value={dateRangePreset} onValueChange={(val: any) => handlePresetChange(val)}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026_ytd">2026 Tax Year-to-Date</SelectItem>
                  <SelectItem value="2025_full">2025 Full Tax Year</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Inputs */}
            <div className="space-y-1 sm:col-span-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Date Range
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset('custom');
                  }}
                  className="h-8 text-[11px] bg-white dark:bg-slate-800"
                />
                <span className="text-slate-400 text-xs">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset('custom');
                  }}
                  className="h-8 text-[11px] bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Fund Filter */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Fund Filter
              </label>
              <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-800">
                  <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designated Funds</SelectItem>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 sm:p-12 bg-white text-slate-900 space-y-8 font-sans print:p-0 print:m-0">
          {isLoading || !statement ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Generating printable statement...
            </div>
          ) : (
            <>
              {/* Church Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">
                    {statement.church.name}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    {statement.church.address}, {statement.church.city}, {statement.church.state} {statement.church.postal_code}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Phone: {statement.church.phone} • Email: {statement.church.email}
                  </p>
                  <p className="text-xs text-slate-700 font-mono font-semibold pt-0.5">
                    Federal Tax ID (EIN): 74-8829104
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded">
                    Annual Contribution Statement
                  </div>
                  <p className="text-xs text-slate-500 font-mono font-medium pt-1">
                    Statement #: {statement.statementNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    Generated: {formatDate(statement.generatedDate)}
                  </p>
                </div>
              </div>

              {/* Donor & Period Information */}
              <div className="grid grid-cols-2 gap-8 py-2">
                <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Donor Information
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {(statement.member as ChurchMember)?.profile?.display_name ||
                      ((statement.member as ChurchMember)?.profile ? `${(statement.member as ChurchMember).profile?.first_name} ${(statement.member as ChurchMember).profile?.last_name}` : 'Valued Donor')}
                  </h3>
                  {(statement.member as ChurchMember)?.membership_number && (
                    <p className="text-xs text-slate-600">
                      Member ID: <strong>{(statement.member as ChurchMember).membership_number}</strong>
                    </p>
                  )}
                  {(statement.member as ChurchMember)?.profile && (
                    <p className="text-xs text-slate-600">
                      {(statement.member as ChurchMember).profile?.city || 'Chennai'}, {(statement.member as ChurchMember).profile?.state || 'Tamil Nadu'}
                    </p>
                  )}
                  {(statement.member as ChurchMember)?.profile?.email && (
                    <p className="text-xs text-slate-600">{(statement.member as ChurchMember).profile?.email}</p>
                  )}
                </div>

                <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200 text-right flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Reporting Contribution Period
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {formatDate(statement.startDate)} — {formatDate(statement.endDate)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-xs text-slate-500">Total Tax-Deductible Contributions:</span>
                    <p className="text-xl font-black font-mono text-emerald-700">
                      {formatCurrency(statement.taxDeductibleAmount, 'INR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Itemized Contribution Records
                </h4>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                      <tr>
                        <th className="p-2.5 pl-3">Date</th>
                        <th className="p-2.5">Designated Fund</th>
                        <th className="p-2.5">Payment Method</th>
                        <th className="p-2.5">Ref / Check #</th>
                        <th className="p-2.5">Tax Deductible</th>
                        <th className="p-2.5 pr-3 text-right">Amount ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {statement.donations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No contributions recorded for this donor in the selected period.
                          </td>
                        </tr>
                      ) : (
                        statement.donations.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-2.5 pl-3 font-medium text-slate-900">{formatDate(tx.donation_date)}</td>
                            <td className="p-2.5 text-slate-700">{tx.fund_name}</td>
                            <td className="p-2.5 text-slate-600 capitalize">{tx.payment_method.replace('_', ' ')}</td>
                            <td className="p-2.5 font-mono text-slate-500">{tx.reference_number || '-'}</td>
                            <td className="p-2.5 text-slate-600">{tx.is_tax_deductible ? 'Yes' : 'No'}</td>
                            <td className="p-2.5 pr-3 text-right font-mono font-bold text-slate-900">
                              ${Number(tx.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-bold">
                      <tr>
                        <td colSpan={5} className="p-3 pl-3 text-right text-xs uppercase tracking-wider text-slate-900">
                          Total Contribution Amount:
                        </td>
                        <td className="p-3 pr-3 text-right font-mono text-sm text-slate-950 font-black">
                          ${statement.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Fund Summary Breakdown */}
              {statement.fundBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Summary by Fund Allocation
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statement.fundBreakdown.map((fb) => (
                      <div key={fb.fund_name} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-[10px] text-slate-500 font-semibold block truncate">{fb.fund_name}</span>
                        <span className="font-bold font-mono text-slate-900 text-sm">
                          ${fb.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {fb.percentage.toFixed(1)}% of total
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tax Compliance & Legal Notice */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-900">Official Tax Receipt Disclaimer:</p>
                <p>
                  Thank you for your generous financial stewardship and faithful investment into the ministry and missions of {statement.church.name}.
                  Pursuant to Internal Revenue Code regulations, no goods or services were provided in whole or partial exchange for this contribution other than intangible religious benefits. Please retain this official statement for your personal tax records.
                </p>
              </div>

              {/* Signature Footer */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-xs">
                <div className="space-y-6">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="text-slate-600 font-medium">Authorized Church Financial Officer / Treasurer</p>
                </div>
                <div className="space-y-6 text-right">
                  <div className="h-10 border-b border-slate-400" />
                  <p className="text-slate-600 font-medium">Date of Issue: {formatDate(statement.generatedDate)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
