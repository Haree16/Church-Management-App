import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Visitor, ChurchMember } from '@/types/database';
import { AlertTriangle, UserCheck, User, Phone, Mail, Calendar, ExternalLink } from 'lucide-react';

interface DuplicatePersonCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: {
    visitors: Visitor[];
    members: ChurchMember[];
  };
  onProceedAnyway: () => void;
  onSelectExistingVisitor?: (visitor: Visitor) => void;
  onSelectExistingMember?: (member: ChurchMember) => void;
}

export function DuplicatePersonCheckModal({
  isOpen,
  onClose,
  duplicates,
  onProceedAnyway,
  onSelectExistingVisitor,
  onSelectExistingMember,
}: DuplicatePersonCheckModalProps) {
  const totalMatches = duplicates.visitors.length + duplicates.members.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Possible Duplicate Found ({totalMatches})
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            We found matching records in the database with the same phone number, email, or name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {duplicates.visitors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Matching Guests / Visitors ({duplicates.visitors.length})
              </h4>
              <div className="space-y-2">
                {duplicates.visitors.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 border rounded-lg bg-amber-50/50 border-amber-200 hover:bg-amber-100/50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {v.first_name} {v.last_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-100 text-sky-800 uppercase">
                          {v.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                        {v.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" /> {v.phone}
                          </div>
                        )}
                        {v.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" /> {v.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3" /> First visit: {v.first_visit_date || v.visit_date} (Visits: {v.visit_count || 1})
                        </div>
                      </div>
                    </div>
                    {onSelectExistingVisitor && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-amber-300 bg-white hover:bg-amber-50"
                        onClick={() => onSelectExistingVisitor(v)}
                      >
                        Record Visit
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {duplicates.members.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Matching Church Members ({duplicates.members.length})
              </h4>
              <div className="space-y-2">
                {duplicates.members.map((m) => {
                  const name = m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : 'Church Member';
                  return (
                    <div
                      key={m.id}
                      className="p-3 border rounded-lg bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 uppercase">
                            Member ({m.role})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                          {m.profile?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" /> {m.profile.phone}
                            </div>
                          )}
                          {m.profile?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" /> {m.profile.email}
                            </div>
                          )}
                        </div>
                      </div>
                      {onSelectExistingMember && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-emerald-300 bg-white hover:bg-emerald-50"
                          onClick={() => onSelectExistingMember(m)}
                        >
                          View Member
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700"
            onClick={onProceedAnyway}
          >
            Create New Visitor Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
