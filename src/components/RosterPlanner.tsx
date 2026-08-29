import React, { useState, useMemo } from 'react';
import { RosterAssignment, Member, ChurchMinistry, SaaSUser } from '../types';
import { MINISTRY_TEAMS } from '../data/initialData';
import { Calendar, UserCheck, Plus, CheckCircle2, Clock, Trash2, Edit3, X, Shield, Lock } from 'lucide-react';
import { getRoleConfig } from '../utils/rbac';

interface RosterPlannerProps {
  roster?: RosterAssignment[];
  members?: Member[];
  ministries?: ChurchMinistry[];
  currentUser?: SaaSUser;
  onAddAssignment: (assignment: RosterAssignment) => void;
  onToggleConfirm: (id: string) => void;
  onRemoveAssignment: (id: string) => void;
}

export const RosterPlanner: React.FC<RosterPlannerProps> = ({
  roster = [],
  members = [],
  ministries = [],
  currentUser,
  onAddAssignment,
  onToggleConfirm,
  onRemoveAssignment
}) => {
  const [selectedServiceDate, setSelectedServiceDate] = useState('2026-08-09');
  
  // Quick schedule modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<RosterAssignment | null>(null);
  const [roleName, setRoleName] = useState('');
  const [team, setTeam] = useState<string>(ministries?.[0]?.name || 'Worship & Music');
  const [memberId, setMemberId] = useState('');

  const safeRoster = roster || [];
  const safeMembers = members || [];

  const userRole = currentUser?.role || 'Member';
  const roleConfig = getRoleConfig(userRole);
  const canManage = roleConfig.canManageRoster || userRole === 'SuperAdmin' || userRole === 'PastorAdmin' || userRole === 'AssistantPastor' || userRole === 'MinistryLeader';

  // Identify matching church member for current user
  const currentMember = useMemo(() => {
    if (!currentUser) return null;
    const cleanPhone = (ph: string) => (ph || '').replace(/\D/g, '').slice(-10);
    return safeMembers.find((m) => 
      (currentUser.email && m.email && m.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (currentUser.phone && m.phone && cleanPhone(m.phone) === cleanPhone(currentUser.phone)) ||
      (`${m.firstName || ''} ${m.lastName || ''}`.trim().toLowerCase() === currentUser.name?.trim().toLowerCase())
    );
  }, [safeMembers, currentUser]);

  const filteredRoster = safeRoster.filter(r => r.serviceDate === selectedServiceDate);

  const handleOpenCreate = () => {
    if (!canManage) return;
    setEditingAssignment(null);
    setRoleName('');
    setTeam(ministries?.[0]?.name || 'Worship & Music');
    setMemberId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (assignment: RosterAssignment) => {
    if (!canManage) return;
    setEditingAssignment(assignment);
    setRoleName(assignment.roleName);
    setTeam(assignment.team || ministries?.[0]?.name || 'Worship & Music');
    setMemberId(assignment.memberId);
    setSelectedServiceDate(assignment.serviceDate);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('You do not have permission to modify roster assignments.');
      return;
    }
    if (!roleName.trim() || !memberId) {
      alert('Please fill in role name and select a volunteer member.');
      return;
    }

    const member = safeMembers.find(m => m.id === memberId);
    if (!member) return;

    const assignmentData: RosterAssignment = {
      id: editingAssignment ? editingAssignment.id : ('rost-' + Date.now()),
      serviceDate: selectedServiceDate,
      serviceName: 'Sunday Morning Service',
      roleName: roleName.trim(),
      team,
      memberId: member.id,
      memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
      confirmed: editingAssignment ? editingAssignment.confirmed : false
    };

    onAddAssignment(assignmentData);
    setRoleName('');
    setEditingAssignment(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Date Header & Quick Add */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">Service Roster & Scheduling</h2>
              <p className="text-xs text-slate-500">
                {canManage ? 'Schedule and manage volunteers for upcoming services' : 'View service assignments and confirm your duties'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Service Date Selector */}
            <select
              value={selectedServiceDate}
              onChange={(e) => setSelectedServiceDate(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="2026-08-09">Sunday, Aug 9, 2026</option>
              <option value="2026-08-16">Sunday, Aug 16, 2026</option>
              <option value="2026-08-23">Sunday, Aug 23, 2026</option>
              <option value="2026-08-30">Sunday, Aug 30, 2026</option>
            </select>

            {/* Only Admins & Ministry Leaders can Assign Volunteers */}
            {canManage && (
              <button
                onClick={handleOpenCreate}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Assign Volunteer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Roster Cards Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>Assignments for <strong>{selectedServiceDate}</strong></span>
          <span>{filteredRoster.filter(r => r.confirmed).length} / {filteredRoster.length} Confirmed</span>
        </div>

        {filteredRoster.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-dashed border-slate-300 space-y-2">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 text-xs">No volunteer roles assigned for this date yet</p>
            <p className="text-[11px] text-slate-500">
              {canManage ? 'Click "Assign Volunteer" to schedule team members for service roles.' : 'Check back later once the leadership publishes the duty roster.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRoster.map((item) => {
              const isOwnDuty = Boolean(
                (currentMember && item.memberId === currentMember.id) ||
                (currentUser?.name && item.memberName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
              );

              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col justify-between space-y-3 transition ${
                    isOwnDuty ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {item.team}
                          </span>
                          {isOwnDuty && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              ★ Your Duty
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5">{item.roleName}</h3>
                      </div>

                      {/* Edit & Delete Controls ONLY for Admins and Ministry Leaders */}
                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
                            title="Edit Assignment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${item.memberName}'s assignment as ${item.roleName}?`)) {
                                onRemoveAssignment(item.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                            title="Remove Assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-2 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.memberName}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${
                      item.confirmed ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {item.confirmed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Confirmed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Pending Confirmation</span>
                        </>
                      )}
                    </span>

                    {/* Allow toggling confirmation if user is Admin/Leader OR if it is the user's OWN duty */}
                    {(canManage || isOwnDuty) ? (
                      <button
                        onClick={() => onToggleConfirm(item.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition shadow-xs ${
                          item.confirmed
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {item.confirmed ? 'Mark Pending' : 'Confirm Attendance'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">View only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign / Edit Volunteer Modal (Admins & Leaders Only) */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingAssignment ? 'Edit Volunteer Assignment' : 'Assign Volunteer Role'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAssignment(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Date</label>
                <select
                  value={selectedServiceDate}
                  onChange={(e) => setSelectedServiceDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="2026-08-09">Sunday, Aug 9, 2026</option>
                  <option value="2026-08-16">Sunday, Aug 16, 2026</option>
                  <option value="2026-08-23">Sunday, Aug 23, 2026</option>
                  <option value="2026-08-30">Sunday, Aug 30, 2026</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ministry Team</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {ministries && ministries.length > 0
                    ? ministries.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} {m.leaderName ? `(Leader: ${m.leaderName})` : ''}
                        </option>
                      ))
                    : MINISTRY_TEAMS.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acoustic Guitarist, Head Usher, Sound Tech"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Member *</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Church Member --</option>
                  {safeMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({(m.ministryTeams || []).join(', ') || 'No team'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAssignment(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition"
                >
                  {editingAssignment ? 'Save Changes' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
