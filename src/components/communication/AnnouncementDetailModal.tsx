import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Announcement } from '@/types/database';
import {
  Megaphone,
  Calendar,
  Users,
  Eye,
  Clock,
  Edit2,
  Trash2,
  Share2,
  Send,
  AlertCircle,
} from 'lucide-react';

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => Promise<void>;
  canManage?: boolean;
}

export function AnnouncementDetailModal({
  isOpen,
  onClose,
  announcement,
  onEdit,
  onDelete,
  canManage = false,
}: AnnouncementDetailModalProps) {
  if (!announcement) return null;

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px]">Urgent</Badge>;
      case 'important':
        return <Badge variant="amber" className="text-[10px]">Important</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Normal</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'published':
        return <Badge variant="emerald" className="text-[10px]">Published Live</Badge>;
      case 'scheduled':
        return <Badge variant="blue" className="text-[10px]">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-[10px]">Draft</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {getStatusBadge(announcement.status)}
              {getPriorityBadge(announcement.priority)}
              <Badge variant="outline" className="text-[10px] capitalize">
                Audience: {announcement.audience.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="h-3.5 w-3.5" />
              <span>{announcement.views_count || 0} views</span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
            <Megaphone className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <span>{announcement.title}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
            <span>By: <strong className="text-slate-700 dark:text-slate-300">{announcement.author_name}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Published: {formatDate(announcement.publish_date)}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Message Body */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {announcement.message || announcement.content}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Expiry Date
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                {announcement.expiry_date ? formatDate(announcement.expiry_date) : 'No expiration set'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Channels
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block capitalize">
                {announcement.channels ? announcement.channels.join(', ') : 'In-App'}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-red-600 hover:bg-red-50 gap-1"
                onClick={() => {
                  if (window.confirm('Delete this announcement?')) {
                    onDelete(announcement.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => {
                    onClose();
                    onEdit(announcement);
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Announcement
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
