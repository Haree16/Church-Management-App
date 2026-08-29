import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CommunicationCampaign, CommunicationChannel } from '@/types/database';
import { communicationService } from '@/services/communicationService';
import { CommunicationComposerDialog } from '@/components/communication/CommunicationComposerDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export function CommunicationComposerPage() {
  const { activeChurch, currentRole, user, profile } = useAuth();
  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  const [campaigns, setCampaigns] = useState<CommunicationCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const currentUserName = profile?.display_name || user?.email?.split('@')[0] || 'Church Staff';

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await communicationService.getCampaigns(churchId);
      setCampaigns(data);
    } catch (e) {
      console.error('Failed to load campaigns:', e);
      toast.error('Failed to load communication broadcasts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [churchId]);

  const getChannelIcon = (ch: CommunicationChannel) => {
    switch (ch) {
      case 'email':
        return <Mail className="h-4 w-4 text-sky-600" />;
      case 'sms':
        return <Smartphone className="h-4 w-4 text-emerald-600" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'push':
        return <Bell className="h-4 w-4 text-purple-600" />;
      default:
        return <Send className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="h-6 w-6 text-sky-600" />
            Multi-Channel Communication & Message Outbox
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dispatch congregation-wide announcements via Email, SMS, WhatsApp, and Mobile Push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadCampaigns}
            className="h-9 gap-1.5 text-xs"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsComposerOpen(true)}
            className="h-9 gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Message Broadcast
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-sky-100 dark:border-sky-950 bg-sky-50/20 dark:bg-sky-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Total Broadcasts</span>
              <Send className="h-4 w-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {campaigns.length}
            </p>
            <span className="text-[10px] text-slate-400">All communication campaigns</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Messages Delivered</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {totalDelivered}
            </p>
            <span className="text-[10px] text-slate-400">Across all channels</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active SMS / WhatsApp</span>
              <Smartphone className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {campaigns.filter((c) => c.channel === 'sms' || c.channel === 'whatsapp').length}
            </p>
            <span className="text-[10px] text-slate-400">Direct mobile dispatches</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Newsletters</span>
              <Mail className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
              {campaigns.filter((c) => c.channel === 'email').length}
            </p>
            <span className="text-[10px] text-slate-400">Email bulletins sent</span>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast History Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-600" />
            Recent Outbound Broadcasts & Outbox History
          </CardTitle>
          <CardDescription className="text-xs">
            Complete audit trail of dispatched SMS alerts, email bulletins, and mobile pushes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading broadcasts...</div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={<Send className="h-10 w-10 text-sky-600" />}
              title="No broadcasts dispatched yet"
              description="Send your first congregation-wide email newsletter or SMS reminder."
              actionLabel="New Message Broadcast"
              onAction={() => setIsComposerOpen(true)}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="p-3 pl-4">Channel</th>
                    <th className="p-3">Campaign Title</th>
                    <th className="p-3">Target Audience</th>
                    <th className="p-3">Recipients</th>
                    <th className="p-3">Delivered</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-1.5 font-semibold capitalize">
                          {getChannelIcon(c.channel)}
                          <span>{c.channel}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {c.title}
                        </span>
                        {c.subject && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            Subject: {c.subject}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {c.audience_type.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {c.recipient_count}
                      </td>

                      <td className="p-3 font-mono text-emerald-600 font-bold">
                        {c.sent_count}
                      </td>

                      <td className="p-3">
                        <Badge
                          variant={c.status === 'sent' ? 'emerald' : c.status === 'scheduled' ? 'blue' : 'outline'}
                          className="text-[10px] capitalize"
                        >
                          {c.status}
                        </Badge>
                      </td>

                      <td className="p-3 pr-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(c.sent_at || c.scheduled_for || c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composer Dialog */}
      <CommunicationComposerDialog
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        churchId={churchId}
        currentUserName={currentUserName}
        onCampaignSent={loadCampaigns}
      />
    </div>
  );
}
export default CommunicationComposerPage;
