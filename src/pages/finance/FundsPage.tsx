import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DonationFund } from '@/types/database';
import {
  financeService,
  CreateFundPayload,
  UpdateFundPayload,
} from '@/services/financeService';
import { FundFormDialog } from '@/components/finance/FundFormDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Wallet,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Target,
  RefreshCw,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

export function FundsPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [funds, setFunds] = useState<DonationFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<DonationFund | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const canManage = ['super_admin', 'church_admin'].includes(currentRole || '');
  const authorInfo = {
    userId: user?.id,
    userName: profile?.display_name || user?.email?.split('@')[0] || 'Finance Admin',
    userRole: currentRole ? currentRole.replace('_', ' ').toUpperCase() : 'Admin',
  };

  const loadFunds = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getFunds(churchId, true);
      setFunds(data);
    } catch (e) {
      console.error('Failed to load funds:', e);
      toast.error('Failed to load accounting funds.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, [churchId]);

  const handleSaveFund = async (payload: CreateFundPayload | UpdateFundPayload) => {
    if (formMode === 'create') {
      await financeService.createFund(churchId, payload as CreateFundPayload, authorInfo);
    } else if (editingFund) {
      await financeService.updateFund(churchId, editingFund.id, payload as UpdateFundPayload, authorInfo);
    }
    await loadFunds();
  };

  const handleDeleteFund = async (fund: DonationFund) => {
    if (fund.is_default) {
      toast.error('Cannot delete the default church fund.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete fund "${fund.name}"?`)) {
      await financeService.deleteFund(churchId, fund.id, authorInfo);
      toast.info('Fund deleted.');
      await loadFunds();
    }
  };

  // Export CSV
  const handleExportFunds = () => {
    const headers = ['Fund Name', 'Code', 'Current Balance', 'Target Budget', 'Default Fund', 'Tax Deductible', 'Active', 'Description'];
    const rows = funds.map((f) => [
      `"${f.name}"`,
      `"${f.code}"`,
      `"${Number(f.current_balance).toFixed(2)}"`,
      `"${f.target_amount ? Number(f.target_amount).toFixed(2) : 'N/A'}"`,
      `"${f.is_default ? 'Yes' : 'No'}"`,
      `"${f.is_tax_deductible ? 'Yes' : 'No'}"`,
      `"${f.is_active ? 'Yes' : 'No'}"`,
      `"${(f.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `church_funds_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Funds report exported as CSV.');
  };

  const filteredFunds = useMemo(() => {
    return funds.filter((f) => {
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(t);
        const matchesCode = f.code.toLowerCase().includes(t);
        const matchesDesc = (f.description || '').toLowerCase().includes(t);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [funds, searchTerm]);

  const totalFundBalance = funds.reduce((acc, f) => acc + Number(f.current_balance), 0);
  const totalTargetGoal = funds.reduce((acc, f) => acc + (f.target_amount ? Number(f.target_amount) : 0), 0);
  const overallPledgePct = totalTargetGoal > 0 ? (totalFundBalance / totalTargetGoal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-sky-600" />
            Accounting Funds & Designated Allocations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chart of accounts, restricted donor funds, annual budget goals, and campaign progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportFunds}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadFunds}
            className="h-9 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={() => {
                setEditingFund(null);
                setFormMode('create');
                setIsFormDialogOpen(true);
              }}
              className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Create Custom Fund
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Total Church Fund Balance</span>
              <DollarSign className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              ${totalFundBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400">Across {funds.length} designated accounts</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Annual Target Budget</span>
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              ${totalTargetGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400">Combined budget goals</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Overall Budget Fulfillment</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {overallPledgePct.toFixed(1)}%
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, overallPledgePct)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search funds by name or code..."
          className="pl-8 h-8 text-xs bg-white dark:bg-slate-900"
        />
      </div>

      {/* Funds Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-sky-600" />
          Loading accounting funds...
        </div>
      ) : filteredFunds.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-10 w-10 text-sky-600" />}
          title="No matching funds found"
          description="Create designated accounting accounts for tithes, offerings, missions, and youth."
          actionLabel={canManage ? 'Create Custom Fund' : undefined}
          onAction={canManage ? () => {
            setEditingFund(null);
            setFormMode('create');
            setIsFormDialogOpen(true);
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredFunds.map((fund) => {
            const pct = fund.target_amount && fund.target_amount > 0
              ? (fund.current_balance / fund.target_amount) * 100
              : null;

            return (
              <Card
                key={fund.id}
                className="relative overflow-hidden transition-all hover:shadow-md border border-slate-200 dark:border-slate-800"
              >
                {/* Accent Color Pill */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: fund.color || '#0284c7' }}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: fund.color || '#0284c7' }}
                        />
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {fund.name}
                        </CardTitle>
                      </div>
                      <span className="text-xs font-mono text-slate-400 block font-medium">
                        Code: {fund.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {fund.is_default && (
                        <Badge variant="blue" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                      {fund.is_tax_deductible && (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-200">
                          Tax-Deductible
                        </Badge>
                      )}
                      {!fund.is_active && (
                        <Badge variant="destructive" className="text-[10px]">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>

                  {fund.description && (
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400 pt-1 line-clamp-2">
                      {fund.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {/* Balance vs Target */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500 font-medium">Current Balance:</span>
                      <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">
                        ${Number(fund.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {fund.target_amount ? (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Target Budget: ${Number(fund.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {pct !== null ? `${pct.toFixed(1)}%` : ''}
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: fund.color || '#0284c7',
                              width: `${Math.min(100, pct || 0)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 block pt-1">
                        Uncapped / Operating general fund without fixed target.
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setEditingFund(fund);
                          setFormMode('edit');
                          setIsFormDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit Fund
                      </Button>

                      {!fund.is_default && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600 hover:bg-red-50 gap-1"
                          onClick={() => handleDeleteFund(fund)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fund Create/Edit Dialog */}
      <FundFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSave={handleSaveFund}
        initialData={editingFund}
        mode={formMode}
      />
    </div>
  );
}
export default FundsPage;
