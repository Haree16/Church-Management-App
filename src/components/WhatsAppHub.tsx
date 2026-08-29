import React, { useState, useRef } from 'react';
import { Member, WhatsAppReminderTemplate, WhatsAppGroup, ChurchTenant } from '../types';
import { 
  MessageSquare, Send, Copy, Check, Sparkles, Users, UserCheck, 
  ShieldCheck, HeartHandshake, PhoneCall, Plus, Trash2, Edit3, X, Save,
  Layers, Info, AlertCircle, FileText, Tag, Link, ExternalLink, Globe, Hash
} from 'lucide-react';

interface WhatsAppHubProps {
  members?: Member[];
  templates?: WhatsAppReminderTemplate[];
  groups?: WhatsAppGroup[];
  currentChurch: ChurchTenant;
  canManageTemplates?: boolean;
  onSaveTemplate?: (template: WhatsAppReminderTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
  onSaveGroup?: (group: WhatsAppGroup) => void;
  onDeleteGroup?: (id: string) => void;
}

const STANDARD_CATEGORIES = [
  'Service Reminder',
  'Prayer Alert',
  'Sunday School',
  'Attendance Follow-up',
  'Tithe Receipt',
  'General Announcement',
  'Event Invitation',
  'Custom'
];

const GROUP_CATEGORIES = [
  'General',
  'Leadership',
  'Youth',
  'Worship',
  'Sunday School',
  'Prayer Warriors',
  'Women',
  'Men',
  'Custom'
];

const VARIABLE_TAGS = [
  { tag: '{MemberName}', label: 'Member Name', desc: 'Full name of recipient' },
  { tag: '{GroupName}', label: 'Group Name', desc: 'Target WhatsApp Group' },
  { tag: '{ChurchName}', label: 'Church Name', desc: 'Your church name' },
  { tag: '{City}', label: 'City', desc: 'Church location' },
  { tag: '{ServiceTime}', label: 'Service Time', desc: 'e.g. 9:00 AM IST' },
  { tag: '{Amount}', label: 'Amount (₹)', desc: 'Tithe/offering figure' },
  { tag: '{FundName}', label: 'Fund Name', desc: 'e.g. Building Fund' },
  { tag: '{ReceiptNo}', label: 'Receipt No', desc: 'e.g. NCA-8801' },
  { tag: '{PrayerTitle}', label: 'Prayer Title', desc: 'Request subject' },
  { tag: '{PrayerDescription}', label: 'Prayer Note', desc: 'Details of prayer' },
  { tag: '{MemoryVerse}', label: 'Memory Verse', desc: 'Sunday school verse' },
];

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  members = [],
  templates = [],
  groups = [],
  currentChurch,
  canManageTemplates = true,
  onSaveTemplate,
  onDeleteTemplate,
  onSaveGroup,
  onDeleteGroup,
}) => {
  const safeMembers = members || [];
  const safeTemplates = templates || [];
  const safeGroups = groups || [];

  // Active View Switcher: 'direct' (Individual Members) vs 'groups' (WhatsApp Groups)
  const [activeTabMode, setActiveTabMode] = useState<'direct' | 'groups'>('direct');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(safeTemplates[0]?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(safeMembers[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(safeGroups[0]?.id || '');
  const [customText, setCustomText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [groupCategoryFilter, setGroupCategoryFilter] = useState<string>('All');
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>('');
  const [searchGroupQuery, setSearchGroupQuery] = useState<string>('');

  // Dynamic parameters
  const [amountParam, setAmountParam] = useState('2500');
  const [fundParam, setFundParam] = useState('Tithe & Offering');
  const [receiptParam, setReceiptParam] = useState('NCA-IND-8801');
  const [prayerTitleParam, setPrayerTitleParam] = useState('Surgical Recovery & Healing');
  const [prayerDescParam, setPrayerDescParam] = useState('Please keep praying for complete victory and peace.');
  const [serviceTimeParam, setServiceTimeParam] = useState('9:00 AM IST');
  const [memoryVerseParam, setMemoryVerseParam] = useState('Ephesians 6:11 - Put on the full armor of God.');

  // Modal State for Create / Edit Template
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState<string>('Service Reminder');
  const [modalCustomCategory, setModalCustomCategory] = useState('');
  const [modalText, setModalText] = useState('');
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Modal State for Create / Edit WhatsApp Group
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [modalGroupName, setModalGroupName] = useState('');
  const [modalGroupCategory, setModalGroupCategory] = useState<string>('General');
  const [modalGroupDescription, setModalGroupDescription] = useState('');
  const [modalGroupInviteLink, setModalGroupInviteLink] = useState('');
  const [modalGroupLeader, setModalGroupLeader] = useState('');
  const [modalGroupMemberCount, setModalGroupMemberCount] = useState<number>(25);
  const [modalGroupColor, setModalGroupColor] = useState('#059669');

  const activeTemplate = safeTemplates.find((t) => t.id === selectedTemplateId) || safeTemplates[0];
  const activeMember = safeMembers.find((m) => m.id === selectedMemberId) || safeMembers[0];
  const activeGroup = safeGroups.find((g) => g.id === selectedGroupId) || safeGroups[0];

  // Open modal for Creating Template
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setModalTitle('');
    setModalCategory('Service Reminder');
    setModalCustomCategory('');
    setModalText('Dear {MemberName}, peace and blessings from {ChurchName} in {City}!\n\nJoin us for service at {ServiceTime}.');
    setIsModalOpen(true);
  };

  // Open modal for Editing Template
  const handleOpenEditModal = (tpl: WhatsAppReminderTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(tpl.id);
    setModalTitle(tpl.title);
    if (STANDARD_CATEGORIES.includes(tpl.category)) {
      setModalCategory(tpl.category);
      setModalCustomCategory('');
    } else {
      setModalCategory('Custom');
      setModalCustomCategory(tpl.category);
    }
    setModalText(tpl.templateText);
    setIsModalOpen(true);
  };

  // Open modal for Creating Group
  const handleOpenCreateGroupModal = () => {
    setEditingGroupId(null);
    setModalGroupName('');
    setModalGroupCategory('General');
    setModalGroupDescription('');
    setModalGroupInviteLink('');
    setModalGroupLeader(currentChurch?.pastorName || '');
    setModalGroupMemberCount(30);
    setModalGroupColor('#059669');
    setIsGroupModalOpen(true);
  };

  // Open modal for Editing Group
  const handleOpenEditGroupModal = (grp: WhatsAppGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroupId(grp.id);
    setModalGroupName(grp.name);
    setModalGroupCategory(grp.category || 'General');
    setModalGroupDescription(grp.description || '');
    setModalGroupInviteLink(grp.inviteLink || '');
    setModalGroupLeader(grp.leaderName || '');
    setModalGroupMemberCount(grp.memberCount || 25);
    setModalGroupColor(grp.color || '#059669');
    setIsGroupModalOpen(true);
  };

  // Insert tag into modal textarea
  const handleInsertTag = (tag: string) => {
    if (!modalTextareaRef.current) {
      setModalText((prev) => prev + ' ' + tag);
      return;
    }
    const textarea = modalTextareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const newText = modalText.substring(0, start) + tag + modalText.substring(end);
    setModalText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Save Modal Template (Create or Update)
  const handleSaveModalTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalText.trim()) {
      alert('Please fill out both the template title and message text.');
      return;
    }

    const finalCategory = modalCategory === 'Custom' && modalCustomCategory.trim() 
      ? modalCustomCategory.trim() 
      : modalCategory;

    const templateToSave: WhatsAppReminderTemplate = {
      id: editingTemplateId || `wa-${Date.now()}`,
      church_id: currentChurch.id,
      churchId: currentChurch.id,
      title: modalTitle.trim(),
      category: finalCategory,
      templateText: modalText.trim(),
    };

    if (onSaveTemplate) {
      onSaveTemplate(templateToSave);
    }

    setSelectedTemplateId(templateToSave.id);
    setCustomText(templateToSave.templateText);
    setIsModalOpen(false);
  };

  // Save Modal WhatsApp Group (Create or Update)
  const handleSaveModalGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGroupName.trim()) {
      alert('Please provide a WhatsApp group name.');
      return;
    }

    const groupToSave: WhatsAppGroup = {
      id: editingGroupId || `wag-${Date.now()}`,
      church_id: currentChurch.id,
      churchId: currentChurch.id,
      name: modalGroupName.trim(),
      category: modalGroupCategory,
      description: modalGroupDescription.trim(),
      inviteLink: modalGroupInviteLink.trim(),
      leaderName: modalGroupLeader.trim(),
      memberCount: Number(modalGroupMemberCount) || 0,
      color: modalGroupColor,
      createdAt: new Date().toISOString(),
    };

    if (onSaveGroup) {
      onSaveGroup(groupToSave);
    }

    setSelectedGroupId(groupToSave.id);
    setIsGroupModalOpen(false);
  };

  // Delete Template
  const handleDeleteTemplate = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete the template "${title}"?`)) {
      if (onDeleteTemplate) {
        onDeleteTemplate(id);
      }
      if (selectedTemplateId === id) {
        const remaining = safeTemplates.filter((t) => t.id !== id);
        if (remaining.length > 0) {
          setSelectedTemplateId(remaining[0].id);
          setCustomText(remaining[0].templateText);
        } else {
          setSelectedTemplateId('');
          setCustomText('');
        }
      }
    }
  };

  // Delete Group
  const handleDeleteGroup = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the WhatsApp group "${name}"?`)) {
      if (onDeleteGroup) {
        onDeleteGroup(id);
      }
      if (selectedGroupId === id) {
        const remaining = safeGroups.filter((g) => g.id !== id);
        if (remaining.length > 0) {
          setSelectedGroupId(remaining[0].id);
        } else {
          setSelectedGroupId('');
        }
      }
    }
  };

  // Substitute placeholders into the message text
  const generateFinalMessage = (): string => {
    let text = customText || activeTemplate?.templateText || '';

    if (activeTabMode === 'groups') {
      text = text.replace(/{MemberName}/g, activeGroup?.name || 'Beloved Church Family');
      text = text.replace(/{GroupName}/g, activeGroup?.name || 'Church Group');
    } else {
      if (activeMember) {
        text = text.replace(/{MemberName}/g, `${activeMember.firstName} ${activeMember.lastName}`);
      }
      text = text.replace(/{GroupName}/g, 'Church Family');
    }

    text = text.replace(/{ChurchName}/g, currentChurch?.name || 'Church');
    text = text.replace(/{City}/g, currentChurch?.city || 'City');
    text = text.replace(/{ServiceTime}/g, serviceTimeParam);
    text = text.replace(/{Amount}/g, amountParam);
    text = text.replace(/{FundName}/g, fundParam);
    text = text.replace(/{ReceiptNo}/g, receiptParam);
    text = text.replace(/{PrayerTitle}/g, prayerTitleParam);
    text = text.replace(/{PrayerDescription}/g, prayerDescParam);
    text = text.replace(/{MemoryVerse}/g, memoryVerseParam);

    return text;
  };

  const finalMessage = generateFinalMessage();

  const sanitizePhone = (ph: string): string => {
    let clean = (ph || '').replace(/\D/g, '');
    if (clean.length === 10) clean = '91' + clean; // default to India country code +91
    return clean;
  };

  const handleOpenWhatsApp = (phoneStr?: string) => {
    const targetPhone = phoneStr ? sanitizePhone(phoneStr) : sanitizePhone(activeMember?.phone || '919840123456');
    const encoded = encodeURIComponent(finalMessage);
    const waUrl = `https://wa.me/${targetPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // Universal WhatsApp Broadcast / Group Share
  const handleShareToGroup = (customGroupLink?: string) => {
    // 1. Copy message to clipboard
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    // 2. If group has a direct invite/chat link, offer opening it, or use universal WhatsApp send
    const encoded = encodeURIComponent(finalMessage);
    const targetUrl = customGroupLink && customGroupLink.startsWith('http')
      ? customGroupLink
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(finalMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter templates
  const filteredTemplates = safeTemplates.filter((t) => {
    if (categoryFilter === 'All') return true;
    return t.category === categoryFilter;
  });

  // Filter members for quick list
  const filteredMembers = safeMembers.filter((m) =>
    `${m.firstName || ''} ${m.lastName || ''} ${m.phone || ''} ${m.status || ''}`.toLowerCase().includes(searchMemberQuery.toLowerCase())
  );

  // Filter groups
  const filteredGroups = safeGroups.filter((g) => {
    const matchCat = groupCategoryFilter === 'All' || g.category === groupCategoryFilter;
    const matchSearch = `${g.name} ${g.leaderName || ''} ${g.description || ''}`.toLowerCase().includes(searchGroupQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Service Reminder':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Prayer Alert':
      case 'Prayer Warriors':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Sunday School':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Attendance Follow-up':
      case 'Youth':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Tithe Receipt':
        return 'bg-sky-100 text-sky-900 border-sky-200';
      case 'General Announcement':
      case 'General':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Event Invitation':
      case 'Leadership':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Worship':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Reminders, Groups & Template Hub
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              WhatsApp Broadcast & Group Messaging Hub
            </h2>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-xl">
              Send personalized reminders to church members or broadcast bulletins, prayer alerts, and youth notices directly to church WhatsApp groups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTabMode === 'direct' ? (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                New Template
              </button>
            ) : (
              <button
                onClick={handleOpenCreateGroupModal}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                + Configure WhatsApp Group
              </button>
            )}

            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center shrink-0">
              <span className="text-[10px] uppercase font-black text-emerald-300">
                {activeTabMode === 'direct' ? 'Templates' : 'Groups'}
              </span>
              <p className="text-lg font-black text-white">
                {activeTabMode === 'direct' ? safeTemplates.length : safeGroups.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Mode Switcher: Member Direct vs WhatsApp Groups */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar scrollbar-none">
        <button
          onClick={() => setActiveTabMode('direct')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
            activeTabMode === 'direct'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Individual Member Direct Send</span>
        </button>

        <button
          onClick={() => setActiveTabMode('groups')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
            activeTabMode === 'groups'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>WhatsApp Group Broadcast Channels ({safeGroups.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls & Templates/Groups Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* ============================================================= */}
          {/* 1. WHATSAPP GROUPS VIEW (IF GROUPS TAB ACTIVE) */}
          {/* ============================================================= */}
          {activeTabMode === 'groups' && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Configured Church WhatsApp Groups
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select a church group channel to broadcast or configure custom groups</p>
                </div>

                <button
                  onClick={handleOpenCreateGroupModal}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
                </button>
              </div>

              {/* Group Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
                <button
                  onClick={() => setGroupCategoryFilter('All')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    groupCategoryFilter === 'All'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({safeGroups.length})
                </button>
                {GROUP_CATEGORIES.map((cat) => {
                  const count = safeGroups.filter((g) => g.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setGroupCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                        groupCategoryFilter === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Groups Grid */}
              {filteredGroups.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-600">No WhatsApp groups configured in this category.</p>
                  <button
                    onClick={handleOpenCreateGroupModal}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Configure First Group Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredGroups.map((grp) => {
                    const isSelected = grp.id === selectedGroupId;
                    return (
                      <div
                        key={grp.id}
                        onClick={() => setSelectedGroupId(grp.id)}
                        className={`p-3.5 rounded-2xl text-left border cursor-pointer transition flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(grp.category)}`}>
                              {grp.category}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditGroupModal(grp, e)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                                title="Edit Group"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteGroup && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteGroup(grp.id, grp.name, e)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                  title="Delete Group"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{grp.name}</h4>
                          {grp.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {grp.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
                            <span>👥 {grp.memberCount || 25} Members</span>
                            <span>•</span>
                            <span>Leader: {grp.leaderName || 'Pastoral Team'}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                          <span>{grp.inviteLink ? '🔗 Invite Link Active' : 'Universal Share'}</span>
                          {isSelected && <span className="text-emerald-700 font-bold flex items-center gap-1">Selected Target ✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Template Selection & Management Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Choose WhatsApp Template
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Select a template or compose a message for your broadcast</p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Template
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar text-xs">
              <button
                onClick={() => setCategoryFilter('All')}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                  categoryFilter === 'All'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({safeTemplates.length})
              </button>
              {STANDARD_CATEGORIES.map((cat) => {
                const count = safeTemplates.filter((t) => t.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-semibold text-slate-600">No templates found in this category.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Template Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setCustomText(tpl.templateText);
                      }}
                      className={`p-3.5 rounded-2xl text-left border cursor-pointer transition flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(tpl.category)}`}>
                            {tpl.category}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(tpl, e)}
                              className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                              title="Edit Template"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteTemplate && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTemplate(tpl.id, tpl.title, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{tpl.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-mono">
                          {tpl.templateText}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>Click to load</span>
                        {isSelected && <span className="text-emerald-700 font-bold flex items-center gap-1">Active ✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recipient & Message Customizer Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              {activeTabMode === 'direct' ? 'Recipient Member & Message Body' : 'Target WhatsApp Group & Message Body'}
            </h3>

            {activeTabMode === 'direct' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Recipient Church Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {safeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.phone}) — {m.status}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Church WhatsApp Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {safeGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.category}) — {g.memberCount || 25} Members
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Placeholder Customizers */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Dynamic Message Parameters
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Auto-populates placeholders in preview</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{'{ServiceTime}'}</label>
                  <input
                    type="text"
                    value={serviceTimeParam}
                    onChange={(e) => setServiceTimeParam(e.target.value)}
                    className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{'{Amount}'} / {'{FundName}'}</label>
                  <div className="flex gap-1 mt-0.5">
                    <input
                      type="text"
                      value={amountParam}
                      onChange={(e) => setAmountParam(e.target.value)}
                      className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                    <input
                      type="text"
                      value={fundParam}
                      onChange={(e) => setFundParam(e.target.value)}
                      className="w-2/3 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{'{ReceiptNo}'}</label>
                  <input
                    type="text"
                    value={receiptParam}
                    onChange={(e) => setReceiptParam(e.target.value)}
                    className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{'{PrayerTitle}'}</label>
                  <input
                    type="text"
                    value={prayerTitleParam}
                    onChange={(e) => setPrayerTitleParam(e.target.value)}
                    className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">{'{MemoryVerse}'}</label>
                  <input
                    type="text"
                    value={memoryVerseParam}
                    onChange={(e) => setMemoryVerseParam(e.target.value)}
                    className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Custom Message Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Editable Live Message Text</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomText(activeTemplate?.templateText || '')}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={customText || activeTemplate?.templateText || ''}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
              />
            </div>

            {/* Direct Action Buttons */}
            {activeTabMode === 'direct' ? (
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => handleOpenWhatsApp()}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition min-w-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-white shrink-0" />
                  </div>
                  <div className="text-left truncate min-w-0">
                    <div className="text-xs sm:text-sm font-black leading-tight">Send via WhatsApp</div>
                    {activeMember && (
                      <div className="text-[11px] font-medium text-emerald-100/90 truncate">
                        to {activeMember.firstName} {activeMember.lastName} • {activeMember.phone}
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleCopyText}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-600 shrink-0" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => handleShareToGroup(activeGroup?.inviteLink)}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition min-w-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-white shrink-0" />
                  </div>
                  <div className="text-left truncate min-w-0">
                    <div className="text-xs sm:text-sm font-black leading-tight">Broadcast to WhatsApp Group</div>
                    {activeGroup && (
                      <div className="text-[11px] font-medium text-emerald-100/90 truncate">
                        to {activeGroup.name} ({activeGroup.memberCount || 25} members)
                      </div>
                    )}
                  </div>
                </button>

                {activeGroup?.inviteLink && (
                  <button
                    onClick={() => window.open(activeGroup.inviteLink, '_blank')}
                    className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-2xl border border-teal-200 flex items-center justify-center gap-1.5 transition shrink-0"
                    title="Open Group Invite Chat"
                  >
                    <ExternalLink className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Open Group</span>
                  </button>
                )}

                <button
                  onClick={handleCopyText}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Copy className="w-4 h-4 text-slate-600 shrink-0" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Mobile Chat Preview Column */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-emerald-950 p-4 rounded-3xl border border-emerald-800 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-inner">
                  {activeTabMode === 'groups' ? (activeGroup?.name.charAt(0) || 'G') : currentChurch.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-tight truncate">
                    {activeTabMode === 'groups' ? (activeGroup?.name || 'WhatsApp Group') : currentChurch.name}
                  </h4>
                  <p className="text-[10px] text-emerald-300 truncate">
                    {activeTabMode === 'groups' ? `${activeGroup?.memberCount || 25} participants • Official Channel` : 'WhatsApp Official Notice'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700 shrink-0">
                {activeTabMode === 'groups' ? 'Group Preview' : 'Preview'}
              </span>
            </div>

            {/* Chat Bubble Container */}
            <div className="bg-[#0b141a] p-4 rounded-2xl min-h-[260px] border border-emerald-900/50 flex flex-col justify-end">
              <div className="bg-[#005c4b] text-emerald-50 p-3.5 rounded-2xl rounded-tr-none text-xs space-y-2 shadow-md max-w-[95%] ml-auto">
                <p className="whitespace-pre-wrap leading-relaxed">{finalMessage}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300 font-mono">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-sky-400 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Direct Target List (Members or Groups) */}
          {activeTabMode === 'direct' ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Direct Send</h4>
                <span className="text-[10px] text-slate-400">{filteredMembers.length} Members</span>
              </div>

              <input
                type="text"
                placeholder="Search member name or phone..."
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{m.phone}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        handleOpenWhatsApp(m.phone);
                      }}
                      className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow shrink-0"
                      title={`Send template to ${m.firstName}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Church Group Channels</h4>
                <button
                  onClick={handleOpenCreateGroupModal}
                  className="text-[10px] text-emerald-700 font-extrabold hover:underline"
                >
                  + Add Group
                </button>
              </div>

              <input
                type="text"
                placeholder="Search groups or leaders..."
                value={searchGroupQuery}
                onChange={(e) => setSearchGroupQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredGroups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{g.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{g.category} • {g.memberCount || 25} members</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          handleShareToGroup(g.inviteLink);
                        }}
                        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow"
                        title={`Share broadcast to ${g.name}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: CREATE / EDIT WHATSAPP TEMPLATE */}
      {/* ============================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingTemplateId ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure reminder presets with dynamic tags</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalTemplate} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Sunday Morning Fasting Prayer Reminder"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {STANDARD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {modalCategory === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    value={modalCustomCategory}
                    onChange={(e) => setModalCustomCategory(e.target.value)}
                    placeholder="e.g. Youth Camp 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Tag Quick-Insert Bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Insert Dynamic Tags</label>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                  {VARIABLE_TAGS.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertTag(v.tag)}
                      className="px-2 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-slate-700 text-[10px] font-mono font-bold rounded-lg border border-slate-200 transition"
                      title={v.desc}
                    >
                      + {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Text Template *</label>
                <textarea
                  ref={modalTextareaRef}
                  required
                  rows={6}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="Dear {MemberName}, peace be with you! Join us for service at {ChurchName}..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tip: Use standard WhatsApp formatting: <code className="text-emerald-700 font-bold">*bold*</code>, <code className="text-emerald-700 font-bold">_italic_</code>, <code className="text-emerald-700 font-bold">~strikethrough~</code>.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingTemplateId ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: CONFIGURE WHATSAPP GROUP */}
      {/* ============================================================= */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingGroupId ? 'Edit WhatsApp Group Channel' : 'Configure WhatsApp Group Channel'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Set up church community & ministry group channels</p>
                </div>
              </div>

              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalGroup} className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Group Name *</label>
                <input
                  type="text"
                  required
                  value={modalGroupName}
                  onChange={(e) => setModalGroupName(e.target.value)}
                  placeholder="e.g. New Creation Church - Youth Fellowship"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Group Category & Leader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Group Ministry / Category</label>
                  <select
                    value={modalGroupCategory}
                    onChange={(e) => setModalGroupCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GROUP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Leader / Admin Name</label>
                  <input
                    type="text"
                    value={modalGroupLeader}
                    onChange={(e) => setModalGroupLeader(e.target.value)}
                    placeholder="e.g. Pastor David / Bro. John"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* WhatsApp Invite Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>WhatsApp Group Invite Link (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. https://chat.whatsapp.com/...</span>
                </label>
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    value={modalGroupInviteLink}
                    onChange={(e) => setModalGroupInviteLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/J8KL90MNOPQ12345678901"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Estimated Member Count & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Member Count</label>
                  <input
                    type="number"
                    min="1"
                    value={modalGroupMemberCount}
                    onChange={(e) => setModalGroupMemberCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Group Accent Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={modalGroupColor}
                      onChange={(e) => setModalGroupColor(e.target.value)}
                      className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-mono text-slate-600">{modalGroupColor}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Group Purpose & Description</label>
                <textarea
                  rows={2}
                  value={modalGroupDescription}
                  onChange={(e) => setModalGroupDescription(e.target.value)}
                  placeholder="e.g. Official communication channel for Sunday school parents and weekly memory verse updates."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingGroupId ? 'Save Group Details' : 'Add WhatsApp Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
