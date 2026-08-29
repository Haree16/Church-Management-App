import React, { useState } from 'react';
import { Member, PrayerRequest, ChurchMinistry } from '../types';
import { 
  X, Phone, Mail, MapPin, Calendar, Users, HeartHandshake, ShieldCheck, 
  Heart, Edit3, Trash2, Lock, Unlock, ExternalLink, MessageSquare, AlertCircle, Plus, Camera, Crown
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Member | null;
  prayers?: PrayerRequest[];
  ministries?: ChurchMinistry[];
  onClose: () => void;
  onEdit: (member: Member) => void;
  onDelete?: (id: string) => void;
  onAddPrayerForMember: (member: Member) => void;
  onNavigateMinistry?: (ministryName: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  prayers = [],
  ministries = [],
  onClose,
  onEdit,
  onDelete,
  onAddPrayerForMember,
  onNavigateMinistry,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  if (!member) return null;

  const fullName = `${member.firstName} ${member.lastName}`;
  const initials = `${member.firstName[0] || ''}${member.lastName[0] || ''}`;

  // Filter prayers submitted by or associated with this member
  const safePrayers = prayers || [];
  const memberPrayers = safePrayers.filter(
    (p) => p.memberId === member.id || (p.memberName && p.memberName.toLowerCase().includes(fullName.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div 
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="relative group cursor-pointer shrink-0"
              title="Click to edit profile or change photo"
            >
              {member.avatarUrl && member.avatarUrl.trim() ? (
                <img
                  src={member.avatarUrl.trim()}
                  alt={fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md group-hover:opacity-85 transition"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-xl flex items-center justify-center border-2 border-amber-400 group-hover:opacity-85 transition">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                <Camera className="w-5 h-5 text-amber-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{fullName}</h2>
              </div>
              <p className="text-xs text-amber-400 font-bold mt-0.5">{member.status}</p>
              <p className="text-xs text-slate-400 mt-1">
                Joined: {new Date(member.joinedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-sm text-slate-700">
          {/* Action Quick Links */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {member.phone ? (
              <a
                href={`tel:${member.phone.replace(/[^0-9]/g, '')}`}
                className="p-2.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 transition text-slate-700"
              >
                <Phone className="w-4 h-4 text-amber-600" />
                <span>Call Phone</span>
              </a>
            ) : (
              <div className="p-2.5 bg-slate-50 opacity-50 rounded-xl text-xs flex flex-col items-center justify-center gap-1 text-slate-400">
                <Phone className="w-4 h-4" />
                <span>No Phone</span>
              </div>
            )}

            {member.phone ? (
              <a
                href={`sms:${member.phone.replace(/[^0-9]/g, '')}`}
                className="p-2.5 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 transition text-slate-700"
              >
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <span>Text SMS</span>
              </a>
            ) : null}

            {member.email ? (
              <a
                href={`mailto:${member.email}`}
                className="p-2.5 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-xl font-medium text-xs flex flex-col items-center justify-center gap-1 transition text-slate-700"
              >
                <Mail className="w-4 h-4 text-slate-700" />
                <span>Email</span>
              </a>
            ) : (
              <div className="p-2.5 bg-slate-50 opacity-50 rounded-xl text-xs flex flex-col items-center justify-center gap-1 text-slate-400">
                <Mail className="w-4 h-4" />
                <span>No Email</span>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">
              Contact Details
            </h3>

            <div className="flex items-center space-x-3 text-xs">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-800 font-medium">{member.phone || 'Not provided'}</span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-800">{member.email || 'Not provided'}</span>
            </div>

            {member.address && (
              <div className="flex items-start space-x-3 text-xs">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800 font-medium">{member.address}</p>
                  <p className="text-slate-500">{member.city}, {member.state} {member.zipCode}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${member.address}, ${member.city}, ${member.state} ${member.zipCode}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-amber-600 hover:underline mt-1 font-medium"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {member.birthdate && (
              <div className="flex items-center space-x-3 text-xs pt-1">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Birthday: <strong>{new Date(member.birthdate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</strong></span>
              </div>
            )}
          </div>

          {/* Household / Family Members */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Household & Family
            </h3>
            {member.familyMembers && member.familyMembers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {(member.familyMembers || []).map((fam) => (
                  <div
                    key={fam.id}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{fam.name}</p>
                      <p className="text-[11px] text-slate-500">{fam.relationship} {fam.age ? `(${fam.age} yrs)` : ''}</p>
                    </div>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">No family members listed on file.</p>
            )}
          </div>

          {/* Volunteer Ministry & Availability */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              Ministry Teams & Availability
            </h3>

            {/* Leadership Role Highlight */}
            {(() => {
              const ledMinistries = (ministries || []).filter(
                (m) =>
                  m.leaderMemberId === member.id ||
                  m.leaderName.toLowerCase().trim() === fullName.toLowerCase().trim() ||
                  m.assistantLeaderMemberId === member.id ||
                  (m.assistantLeaderName && m.assistantLeaderName.toLowerCase().trim() === fullName.toLowerCase().trim())
              );

              if (ledMinistries.length === 0) return null;

              return (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 font-bold">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                        Ministry Leader
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {ledMinistries.map((m) => m.name).join(' • ')}
                      </span>
                    </div>
                  </div>

                  {onNavigateMinistry && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateMinistry(ledMinistries[0].id || ledMinistries[0].name);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-sm transition shrink-0"
                    >
                      View Ministry &rarr;
                    </button>
                  )}
                </div>
              );
            })()}

            {member.ministryTeams && member.ministryTeams.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(member.ministryTeams || []).map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => {
                      if (onNavigateMinistry) {
                        onClose();
                        onNavigateMinistry(team);
                      }
                    }}
                    className={`font-semibold text-xs px-2.5 py-1 rounded-lg border text-left transition ${
                      onNavigateMinistry 
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300 cursor-pointer shadow-xs active:scale-95' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                    title={onNavigateMinistry ? `Click to view ${team} Ministry` : team}
                  >
                    {team}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Not currently serving on a ministry team.</p>
            )}

            {member.availability && member.availability.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-slate-500">Available: </span>
                <span className="font-medium text-slate-800">{(member.availability || []).join(' • ')}</span>
              </div>
            )}

            {member.skills && member.skills.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-slate-500">Skills / Talents: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(member.skills || []).map((skill) => (
                    <span key={skill} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prayer Requests for this member */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                Prayer Requests ({memberPrayers.length})
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onAddPrayerForMember(member);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Request
              </button>
            </div>

            {memberPrayers.length > 0 ? (
              <div className="space-y-2">
                {(memberPrayers || []).map((pray) => (
                  <div key={pray.id} className="bg-rose-50/60 border border-rose-200/80 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{pray.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pray.status === 'Urgent' ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pray.status}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2">{pray.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">No active prayer requests registered for this member.</p>
            )}
          </div>

          {/* Pastoral Notes */}
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Pastoral & Care Notes</span>
              </div>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 bg-amber-200/60 px-2 py-1 rounded-lg"
              >
                {showNotes ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{showNotes ? 'Hide Notes' : 'Unlock / Reveal'}</span>
              </button>
            </div>

            {showNotes ? (
              <p className="text-xs text-amber-950 font-sans leading-relaxed bg-white p-2.5 rounded-xl border border-amber-200">
                {member.pastoralNotes || 'No notes added yet.'}
              </p>
            ) : (
              <p className="text-[11px] text-amber-800/80 italic">
                Notes are protected for confidential care. Click reveal to inspect.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${fullName} from the directory?`)) {
                if (onDelete) onDelete(member.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-rose-50 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(member);
              }}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
