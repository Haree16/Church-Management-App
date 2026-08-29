import React, { useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  CommunicationChannel,
  AnnouncementAudience,
} from '@/types/database';
import {
  communicationService,
  SendMessagePayload,
} from '@/services/communicationService';
import {
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  Send,
  Users,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommunicationComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  onCampaignSent?: () => void;
  currentUserName?: string;
}

export function CommunicationComposerDialog({
  isOpen,
  onClose,
  churchId,
  onCampaignSent,
  currentUserName = 'Church Staff',
}: CommunicationComposerDialogProps) {
  const [channel, setChannel] = useState<CommunicationChannel>('email');
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('everyone');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Realtime recipient estimation
  const recipients = useMemo(() => {
    return communicationService.getRecipientsForAudience(churchId, audience);
  }, [churchId, audience]);

  // SMS character & segment calculation
  const smsLength = content.length;
  const smsSegments = Math.ceil(smsLength / 160) || 1;

  const handleInsertVariable = (varName: string) => {
    setContent((prev) => `${prev} {${varName}}`);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Campaign title is required';
    if (channel === 'email' && !subject.trim()) newErrors.subject = 'Email subject line is required';
    if (!content.trim()) newErrors.content = 'Message content cannot be blank';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SendMessagePayload = {
        title: title.trim(),
        channel,
        audience_type: audience,
        subject: channel === 'email' ? subject.trim() : null,
        content: content.trim(),
        sender_name: currentUserName,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      };

      await communicationService.sendCampaign(churchId, payload, currentUserName);
      toast.success(
        scheduledFor
          ? `Broadcast scheduled for ${new Date(scheduledFor).toLocaleString()} (${recipients.length} recipients)`
          : `Broadcast dispatched successfully to ${recipients.length} recipients via ${channel.toUpperCase()}!`
      );
      if (onCampaignSent) onCampaignSent();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Send className="h-5 w-5" />
                <DialogTitle className="text-base font-bold">
                  Multi-Channel Communication Composer
                </DialogTitle>
              </div>

              <Badge variant="blue" className="text-xs gap-1 font-mono">
                <Users className="h-3 w-3" />
                ~{recipients.length} Recipients
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              Prepare and broadcast messages across Email, SMS, WhatsApp, and Push with integration-ready architecture.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            {/* Channel Switcher */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Communication Channel *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    channel === 'email'
                      ? 'border-sky-500 bg-sky-50/60 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Mail className="h-5 w-5 text-sky-600" />
                  <span>Email Bulletin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    channel === 'sms'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <span>SMS Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    channel === 'whatsapp'
                      ? 'border-green-500 bg-green-50/60 text-green-700 dark:bg-green-950/40 dark:text-green-300 ring-2 ring-green-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('push')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    channel === 'push'
                      ? 'border-purple-500 bg-purple-50/60 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Bell className="h-5 w-5 text-purple-600" />
                  <span>Mobile Push</span>
                </button>
              </div>
            </div>

            {/* Campaign Name & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Internal Campaign Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g. Sunday Service Reminder SMS"
                  className={errors.title ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.title && <span className="text-[10px] text-red-500">{errors.title}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Audience Group *
                </label>
                <Select value={audience} onValueChange={(val: any) => setAudience(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">All Congregation Members & Visitors</SelectItem>
                    <SelectItem value="members">Official Church Members Only</SelectItem>
                    <SelectItem value="volunteers">Active Ministry Volunteers</SelectItem>
                    <SelectItem value="youth">Youth Students</SelectItem>
                    <SelectItem value="parents">Parents of Children & Youth</SelectItem>
                    <SelectItem value="new_members">Recent New Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email Subject if Email */}
            {channel === 'email' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Email Subject Line *
                </label>
                <Input
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                  }}
                  placeholder="e.g. This Sunday at Grace Valley: Community Worship & Fall Kickoff"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && <span className="text-[10px] text-red-500">{errors.subject}</span>}
              </div>
            )}

            {/* Template Variables Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-sky-500" /> Insert Variable:
              </span>
              {['first_name', 'last_name', 'church_name', 'date', 'service_time'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVariable(v)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 hover:bg-sky-100 dark:hover:bg-sky-950 transition-colors"
                >
                  +{`{${v}}`}
                </button>
              ))}
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Message Content *
                </label>
                {channel === 'sms' && (
                  <span className={`text-[10px] font-mono ${smsLength > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                    {smsLength} chars ({smsSegments} SMS segment{smsSegments > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
                }}
                placeholder={
                  channel === 'sms'
                    ? 'Write concise SMS text under 160 characters...'
                    : channel === 'whatsapp'
                    ? 'Write formatted WhatsApp message (*bold*, _italic_)...'
                    : 'Compose full message body...'
                }
                rows={channel === 'sms' || channel === 'push' ? 3 : 6}
                className={`w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-800 ${
                  errors.content ? 'border-red-500' : ''
                }`}
              />
              {errors.content && <span className="text-[10px] text-red-500">{errors.content}</span>}
            </div>

            {/* Schedule Option */}
            <div className="space-y-1 pt-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Schedule for Future Delivery (Optional)
              </label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Leave blank to dispatch immediately.
              </span>
            </div>

            {/* Architecture note */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <span>
                Backend communication drivers process outbound requests securely without exposing secret API keys on the frontend.
              </span>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold gap-1.5"
              isLoading={isSubmitting}
            >
              <Send className="h-3.5 w-3.5" />
              {scheduledFor ? 'Schedule Broadcast' : 'Send Broadcast Now'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
