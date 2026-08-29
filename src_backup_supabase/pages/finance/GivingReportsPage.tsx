import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Donation,
  DonationFund,
} from '@/types/database';
import {
  financeService,
  GivingDashboardMetrics,
  PAYMENT_METHODS,
} from '@/services/financeService';
import { GivingStatementModal } from '@/components/finance/GivingStatementModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileBarChart2,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Building,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  PieChart,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function GivingReportsPage() {
  const { activeChurch, currentRole, user } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [donations, setDonations] = useState<Donation[]>([]);
  const [funds, setFunds] = useState<DonationFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dons, fnds] = await Promise.all([
        financeService.getDonations(churchId, currentRole, user?.id),
        financeService.getFunds(churchId, true),
      ]);
      setDonations(dons);
      setFunds(fnds);
    } catch (e) {
      console.error('Failed to load giving reports data:', e);
      toast.error('Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [churchId, currentRole, user?.id]);

  const metrics: GivingDashboardMetrics = useMemo(() => {
    return financeService.computeGivingDashboardMetrics(donations, funds);
  }, [donations, funds]);

  // Max value for monthly chart scaling
  const maxMonthlyAmount = useMemo(() => {
    const maxVal = Math.max(...metrics.monthlyTrend.map((m) => m.amount), 100);
    return maxVal;
  }, [metrics.monthlyTrend]);

  // Export Monthly Report CSV
  const handleExportMonthly = () => {
    const headers = ['Month', 'Total Amount ($)', 'Active Donors'];
    const rows = metrics.monthlyTrend.map((m) => [
      `"${m.month}"`,
      `"${m.amount.toFixed(2)}"`,
      `"${m.donors}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `monthly_giving_trend_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Monthly giving trend exported as CSV.');
  };

  // Export Fund Allocation Report CSV
  const handleExportFundsCSV = () => {
    const headers = ['Fund Name', 'Total Contributed ($)', 'Share Percentage (%)'];
    const rows = metrics.givingByFund.map((f) => [
      `"${f.fund_name}"`,
      `"${f.amount.toFixed(2)}"`,
      `"${f.percentage.toFixed(2)}%"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fund_allocation_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fund allocation report exported as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-emerald-600" />
            Giving Dashboard & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monthly contribution trends, fund distribution analytics, payment method breakdown, and donor tax statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportMonthly}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            Monthly Trend CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportFundsCSV}
            className="h-9 gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            Fund Allocation CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setIsStatementModalOpen(true)}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Generate Giving Statements
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* 1. This Month */}
        <Card className="border-emerald-100 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Giving This Month</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              ${metrics.totalThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" />
              Active monthly receipts
            </span>
          </CardContent>
        </Card>

        {/* 2. This Year */}
        <Card className="border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Giving This Year (YTD)</span>
              <Calendar className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              ${metrics.totalThisYear.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400">Total {new Date().getFullYear()} fiscal receipts</span>
          </CardContent>
        </Card>

        {/* 3. Donors Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Donors</span>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {metrics.donorsCount}
            </p>
            <span className="text-[10px] text-slate-400">Contributing households & guests</span>
          </CardContent>
        </Card>

        {/* 4. Average Donation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Average Gift</span>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              ${metrics.averageDonation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-400">Average per transaction</span>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend Visual Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Monthly Giving Trend (Recent 6 Months)
              </CardTitle>
              <CardDescription className="text-xs">
                Total monthly tithes, offerings, and missions received
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Total: ${metrics.totalAllTime.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-6 gap-3 items-end h-52 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
              {metrics.monthlyTrend.map((m) => {
                const heightPct = maxMonthlyAmount > 0 ? (m.amount / maxMonthlyAmount) * 100 : 0;
                return (
                  <div key={m.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${m.amount > 0 ? (m.amount >= 1000 ? `${(m.amount / 1000).toFixed(1)}k` : m.amount.toFixed(0)) : '0'}
                    </span>
                    <div
                      className="w-full max-w-[42px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-500 relative"
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                    />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate w-full text-center">
                      {m.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Past 6 months active financial inflow</span>
              <span className="font-semibold text-emerald-600">
                Peak Month: ${maxMonthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-purple-600" />
              Payment Method Distribution
            </CardTitle>
            <CardDescription className="text-xs">Channels of congregation giving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.givingByMethod.map((item) => {
              const methodObj = PAYMENT_METHODS.find((m) => m.value === item.method);
              return (
                <div key={item.method} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {methodObj?.label || item.method}
                    </span>
                    <span className="font-mono text-slate-500">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Fund Distribution Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building className="h-4 w-4 text-sky-600" />
            Designated Fund Allocation Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of all contributions across designated ministries and funds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.givingByFund.map((f) => (
              <div
                key={f.fund_id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                    <span className="font-bold text-slate-900 dark:text-slate-100">{f.fund_name}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {f.percentage.toFixed(1)}%
                  </Badge>
                </div>

                <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                  ${f.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: f.color, width: `${Math.min(100, f.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statement Modal */}
      <GivingStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        churchId={churchId}
        funds={funds}
      />
    </div>
  );
}
export default GivingReportsPage;
