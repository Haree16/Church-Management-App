import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PrayerRequest,
  PrayerPrivacy,
  UserRole,
} from '@/types/database';
import {
  PRAYER_PRIVACY_LEVELS,
  PRAYER_STATUSES,
  PRAYER_CATEGORIES,
} from '@/services/prayerService';
import {
  Heart,
  Shield,
  Lock,
  Users,
  Globe,
  Sparkles,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';

interface PrayerCardProps {
  prayer: PrayerRequest;
  onView: (prayer: PrayerRequest) => void;
  onTogglePray: (prayerId: string) => Promise<void>;
  onAddNote: (prayer: PrayerRequest) => void;
  onMarkAnswered: (prayer: PrayerRequest) => void;
  onAssign: (prayer: PrayerRequest) => void;
  onEdit: (prayer: PrayerRequest) => void;
  onDelete: (prayerId: string) => Promise<void>;
  currentUserRole?: UserRole | null;
  currentUserId?: string | null;
}

export function PrayerCard({
  prayer,
  onView,
  onTogglePray,
  onAddNote,
  onMarkAnswered,
  onAssign,
  onEdit,
  onDelete,
  currentUserRole,
  currentUserId,
}: PrayerCardProps) {
  const [isPrayingAnim, setIsPrayingAnim] = useState(false);

  const privacyMeta = PRAYER_PRIVACY_LEVELS.find((p) => p.value === prayer.privacy) || PRAYER_PRIVACY_LEVELS[0];
  const statusMeta = PRAYER_STATUSES.find((s) => s.value === prayer.status) || PRAYER_STATUSES[0];
  const categoryMeta = PRAYER_CATEGORIES.find((c) => c.value === prayer.category) || PRAYER_CATEGORIES[0];

  const hasPrayed = currentUserId && prayer.prayed_user_ids?.includes(currentUserId);
  const canManage = ['super_admin', 'pastor', 'church_admin', 'ministry_leader'].includes(currentUserRole || '');
  const isAuthor = currentUserId && prayer.member_id === currentUserId;

  const handlePray = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPrayingAnim(true);
    await onTogglePray(prayer.id);
    setTimeout(() => setIsPrayingAnim(false), 500);
  };

  const getPrivacyIcon = (level: PrayerPrivacy) => {
    switch (level) {
      case 'church_wide':
        return <Globe className="h-3 w-3 text-emerald-500" />;
      case 'prayer_team':
        return <Users className="h-3 w-3 text-purple-500" />;
      case 'pastor_only':
        return <Shield className="h-3 w-3 text-amber-500" />;
      case 'private':
        return <Lock className="h-3 w-3 text-rose-500" />;
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card
      onClick={() => onView(prayer)}
      className={`group cursor-pointer transition-all hover:shadow-md border ${
        prayer.is_answered
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
          : prayer.privacy === 'pastor_only' || prayer.privacy === 'private'
          ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/10'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusMeta.badgeVariant} className="text-[10px] px-1.5 py-0">
              {statusMeta.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
              {getPrivacyIcon(prayer.privacy)}
              {privacyMeta.label}
            </Badge>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {categoryMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {formatDate(prayer.created_at)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => onView(prayer)}>
                  View Details & Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddNote(prayer)}>
                  <MessageSquare className="h-3.5 w-3.5 mr-2 text-rose-500" />
                  Add Prayer Note
                </DropdownMenuItem>
                {!prayer.is_answered && (
                  <DropdownMenuItem onClick={() => onMarkAnswered(prayer)}>
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                    Mark Answered Praise
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <DropdownMenuItem onClick={() => onAssign(prayer)}>
                    <UserCheck className="h-3.5 w-3.5 mr-2 text-sky-500" />
                    Assign Team / Pastor
                  </DropdownMenuItem>
                )}
                {(canManage || isAuthor) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(prayer)}>
                      <Edit2 className="h-3.5 w-3.5 mr-2" />
                      Edit Request
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm('Delete this prayer request?')) {
                          onDelete(prayer.id);
                        }
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete Request
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-rose-600 transition-colors">
          {prayer.title}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-2 text-xs">
        <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {prayer.description || prayer.request}
        </p>

        {/* Answered Praise Highlight */}
        {prayer.is_answered && prayer.praise_report && (
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 font-medium">"{prayer.praise_report}"</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 text-[11px]">
          <span>By: <strong className="text-slate-700 dark:text-slate-300 font-medium">{prayer.author_name}</strong></span>
          {prayer.prayer_notes && prayer.prayer_notes.length > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400" title={`${prayer.prayer_notes.length} notes`}>
              <MessageSquare className="h-3 w-3" />
              {prayer.prayer_notes.length}
            </span>
          )}
        </div>

        <Button
          onClick={handlePray}
          size="sm"
          variant="ghost"
          className={`h-7 px-2 text-xs gap-1 transition-all ${
            hasPrayed
              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 font-semibold'
              : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
          } ${isPrayingAnim ? 'scale-110' : ''}`}
        >
          <Heart className={`h-3.5 w-3.5 ${hasPrayed ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{prayer.prayer_count || 0}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
