import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinanceAuditLog } from '@/types/database';
import { financeService } from '@/services/financeService';
import { History, Shield, Clock, User, ArrowRight, RefreshCw, FileText } from 'lucide-react';

interface FinanceAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
}

export function FinanceAuditLogModal({
  isOpen,
  onClose,
  churchId,
}: FinanceAuditLogModalProps) {
  const [logs, setLogs] = useState<FinanceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getAuditLogs(churchId);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load finance audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, churchId]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge variant="emerald" className="text-[10px]">Created</Badge>;
      case 'updated':
        return <Badge variant="blue" className="text-[10px]">Updated</Badge>;
      case 'archived':
        return <Badge variant="amber" className="text-[10px]">Archived</Badge>;
      case 'deleted':
        return <Badge variant="destructive" className="text-[10px]">Deleted</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{action}</Badge>;
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 gap-0">
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-lg">
              <History className="h-5 w-5 text-sky-600" />
              <span>Financial Audit Trail & Change Log</span>
            </div>
            <p className="text-xs text-slate-500">
              Immutable ledger of all financial entries, edits, reallocations, and voids.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadLogs}
            className="h-8 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="p-6 space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading financial audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No finance audit events recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                      {log.entity_type}
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {log.notes}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    Staff: <strong className="text-slate-700 dark:text-slate-300 ml-0.5">{log.user_name}</strong>
                  </span>
                  {log.user_role && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                      {log.user_role}
                    </Badge>
                  )}
                </div>

                {/* Diff View if Updated */}
                {log.action === 'updated' && (log.previous_value || log.new_value) && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-mono">
                    <div>
                      <span className="text-red-600 dark:text-red-400 font-bold block mb-0.5">Previous Value:</span>
                      <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap truncate">
                        {JSON.stringify(log.previous_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">New Value:</span>
                      <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap truncate">
                        {JSON.stringify(log.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
