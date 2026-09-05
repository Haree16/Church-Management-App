import React from 'react';
import { Member } from '@/types';
import { AlertTriangle, UserCheck, ChevronRight, X } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

interface DuplicateMemberCheckModalProps {
  isOpen: boolean;
  duplicateCandidates: Member[];
  onClose: () => void;
  onReviewExisting: (candidate: Member) => void;
  onProceedAnyway: () => void;
}

export const DuplicateMemberCheckModal: React.FC<DuplicateMemberCheckModalProps> = ({
  isOpen,
  duplicateCandidates,
  onClose,
  onReviewExisting,
  onProceedAnyway,
}) => {
  if (!isOpen || duplicateCandidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-amber-300 dark:border-amber-800 overflow-hidden my-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-amber-200 dark:border-amber-900/40 pb-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Possible Existing Member Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A member with matching phone, email, or name already exists in the directory.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Candidates List */}
        <div className="space-y-2">
          {duplicateCandidates.map((cand) => {
            const fullName = `${cand.firstName} ${cand.lastName}`;
            return (
              <div
                key={cand.id}
                className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={fullName} avatarUrl={cand.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{fullName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {cand.phone ? `${cand.phone} • ` : ''}{cand.email || 'No email'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onReviewExisting(cand)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 shrink-0"
                >
                  <span>Review Existing Member</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={onProceedAnyway}
            className="px-4 py-2 font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 rounded-xl transition shadow-xs"
          >
            Create Distinct Record Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
