import React from 'react';
import { Member, PrayerRequest, ChurchMinistry, AttendanceRecord, RosterAssignment, ChurchEvent } from '../types';
import { Member360Profile } from './people/Member360Profile';

interface MemberDetailModalProps {
  member: Member | null;
  allMembers?: Member[];
  prayers?: PrayerRequest[];
  ministries?: ChurchMinistry[];
  attendance?: AttendanceRecord[];
  events?: ChurchEvent[];
  roster?: RosterAssignment[];
  onClose: () => void;
  onEdit: (member: Member) => void;
  onDelete?: (id: string) => void;
  onAddPrayerForMember: (member: Member) => void;
  onNavigateMinistry?: (ministryName: string) => void;
  onSelectFamilyMember?: (familyMember: Member) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  allMembers = [],
  prayers = [],
  ministries = [],
  attendance = [],
  events = [],
  roster = [],
  onClose,
  onEdit,
  onDelete,
  onAddPrayerForMember,
  onNavigateMinistry,
  onSelectFamilyMember,
}) => {
  if (!member) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <Member360Profile
          member={member}
          allMembers={allMembers}
          prayers={prayers}
          ministries={ministries}
          attendance={attendance}
          events={events}
          roster={roster}
          onClose={onClose}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddPrayerForMember={onAddPrayerForMember}
          onNavigateMinistry={onNavigateMinistry}
          onSelectFamilyMember={onSelectFamilyMember}
        />
      </div>
    </div>
  );
};
