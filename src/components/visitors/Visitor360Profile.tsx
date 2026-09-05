import React, { useState, useEffect } from 'react';
import { Visitor, VisitorVisit, FollowUp, VisitorStatus, Profile } from '@/types/database';
import { visitorService } from '@/services/visitorService';
import { followUpService } from '@/services/followUpService';
import { PastoralCareModule } from '@/components/care/PastoralCareModule';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Edit,
  Trash2,
  ChevronRight,
  Send,
  Plus,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Visitor360ProfileProps {
  visitor: Visitor;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onConvert?: (visitor: Visitor) => void;
  onEdit?: (visitor: Visitor) => void;
}

export function Visitor360Profile({
  visitor,
  isOpen,
  onClose,
  onUpdate,
  onConvert,
  onEdit,
}: Visitor360ProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'followups' | 'care' | 'timeline'>('overview');
  const [visits, setVisits] = useState<VisitorVisit[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // New Visit Dialog State
  const [showLogVisitDialog, setShowLogVisitDialog] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceAttended, setServiceAttended] = useState(visitor.service_attended || 'Sunday Contemporary Service');
  const [visitNotes, setVisitNotes] = useState('');
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // New Follow-up Dialog State
  const [showAddFollowUpDialog, setShowAddFollowUpDialog] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState(`Follow up with ${visitor.first_name} ${visitor.last_name}`);
  const [followUpDueDate, setFollowUpDueDate] = useState(new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0]);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [followUpType, setFollowUpType] = useState<string>('new_visitor');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  useEffect(() => {
    if (isOpen && visitor) {
      fetchVisitorData();
    }
  }, [isOpen, visitor]);

  const fetchVisitorData = async () => {
    setLoading(true);
    try {
      const visitsData = await visitorService.getVisitorVisits(visitor.church_id, visitor.id);
      const followUpsData = await followUpService.getFollowUps(visitor.church_id);
      const visitorFollowUps = followUpsData.filter((f) => f.visitor_id === visitor.id);

      setVisits(visitsData);
      setFollowUps(visitorFollowUps);
    } catch (err) {
      console.error('Failed to load visitor 360 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVisit(true);
    try {
      await visitorService.recordVisitorVisit(visitor.church_id, visitor.id, {
        visit_date: visitDate,
        service_attended: serviceAttended,
        notes: visitNotes,
      });
      toast.success('Return visit recorded successfully!');
      setShowLogVisitDialog(false);
      setVisitNotes('');
      fetchVisitorData();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record visit.');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleAddFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFollowUp(true);
    try {
      await followUpService.createFollowUp(visitor.church_id, {
        title: followUpTitle,
        type: (followUpType as any) || 'new_visitor',
        priority: followUpPriority,
        due_date: followUpDueDate,
        status: 'pending',
        visitor_id: visitor.id,
        person_name: `${visitor.first_name} ${visitor.last_name}`,
        person_phone: visitor.phone || undefined,
        person_email: visitor.email || undefined,
        assigned_to: visitor.assigned_to || undefined,
        notes: followUpNotes,
      });
      toast.success('Follow-up task created!');
      setShowAddFollowUpDialog(false);
      setFollowUpNotes('');
      fetchVisitorData();
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create follow-up task.');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleStatusChange = async (newStatus: VisitorStatus) => {
    try {
      await visitorService.updateVisitor(visitor.church_id, visitor.id, { status: newStatus });
      toast.success(`Visitor status updated to ${newStatus.replace(/_/g, ' ')}`);
      onUpdate();
    } catch (err: any) {
      toast.error('Failed to update visitor status.');
    }
  };

  const getStatusBadgeColor = (status: VisitorStatus) => {
    switch (status) {
      case 'new':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'contact_pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'follow_up_scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'follow_up_completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'returned_visitor':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'regular_attendee':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'became_member':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'inactive':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const initials = `${visitor.first_name?.[0] || ''}${visitor.last_name?.[0] || ''}`.toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 bg-slate-50">
        {/* Header Section */}
        <div className="bg-white border-b p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {visitor.first_name} {visitor.last_name}
                  </h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getStatusBadgeColor(visitor.status)}`}>
                    {visitor.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {(visitor.visit_count || 1) > 1 && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      Returned Visitor ({visitor.visit_count} Visits)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  {visitor.phone && (
                    <a href={`tel:${visitor.phone}`} className="flex items-center gap-1 hover:text-sky-600">
                      <Phone className="h-3.5 w-3.5" /> {visitor.phone}
                    </a>
                  )}
                  {visitor.email && (
                    <a href={`mailto:${visitor.email}`} className="flex items-center gap-1 hover:text-sky-600">
                      <Mail className="h-3.5 w-3.5" /> {visitor.email}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> First Visit: {visitor.first_visit_date || visitor.visit_date}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                onClick={() => setShowLogVisitDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Visit
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                onClick={() => setShowAddFollowUpDialog(true)}
              >
                <Clock className="h-3.5 w-3.5 mr-1" /> Add Follow-up
              </Button>

              {visitor.status !== 'became_member' && onConvert && (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onConvert(visitor)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Convert to Member
                </Button>
              )}

              {onEdit && (
                <Button size="sm" variant="ghost" onClick={() => onEdit(visitor)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-200 mt-6 -mb-4">
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'visits'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('visits')}
            >
              Visit History
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {visits.length || visitor.visit_count || 1}
              </span>
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'followups'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('followups')}
            >
              Follow-ups & Care
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {followUps.length}
              </span>
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'care'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('care')}
            >
              Pastoral Care Records
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-sky-600 text-sky-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Card */}
              <div className="md:col-span-2 space-y-6">
                {/* Guest Journey & Stage Selector */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-sky-600" /> Lifecycle Stage Transition
                  </h3>
                  <div className="flex items-center gap-2">
                    <Select value={visitor.status} onValueChange={(val) => handleStatusChange(val as VisitorStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Update Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New First-Time Guest</SelectItem>
                        <SelectItem value="contact_pending">Contact Pending</SelectItem>
                        <SelectItem value="contacted">Contacted / Welcomed</SelectItem>
                        <SelectItem value="follow_up_scheduled">Follow-up Scheduled</SelectItem>
                        <SelectItem value="follow_up_completed">Follow-up Completed</SelectItem>
                        <SelectItem value="returned_visitor">Returned Visitor</SelectItem>
                        <SelectItem value="regular_attendee">Regular Attendee</SelectItem>
                        <SelectItem value="became_member">Became Member</SelectItem>
                        <SelectItem value="inactive">Inactive Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Prayer Request & Notes */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-amber-500" /> Prayer Requests
                    </h3>
                    <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-100 text-sm text-slate-700">
                      {visitor.prayer_request || 'No specific prayer requests noted during registration.'}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-400" /> Pastoral & Team Notes
                    </h3>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-sm text-slate-700">
                      {visitor.notes || 'No general notes.'}
                    </div>
                  </div>
                </div>

                {/* Contact & Location Details */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact & Personal Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Address</span>
                      <span className="text-slate-800 font-medium">
                        {visitor.address ? `${visitor.address}, ${visitor.city || ''} ${visitor.state || ''}` : 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Family Size</span>
                      <span className="text-slate-800 font-medium">{visitor.family_size || 1} Person(s)</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Invited By</span>
                      <span className="text-slate-800 font-medium">{visitor.invited_by || 'Self / Walk-in'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Heard About Church</span>
                      <span className="text-slate-800 font-medium">{visitor.heard_about || 'Friend / Family'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Assigned Leader Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Pastoral Leader
                  </h3>
                  {visitor.assigned_leader ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                        {visitor.assigned_leader.first_name?.[0]}
                        {visitor.assigned_leader.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {visitor.assigned_leader.display_name ||
                            `${visitor.assigned_leader.first_name} ${visitor.assigned_leader.last_name}`}
                        </div>
                        <div className="text-xs text-slate-500">{visitor.assigned_leader.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No leader currently assigned.</div>
                  )}
                </div>

                {/* Visit Summary */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Attendance Summary
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between py-1 border-b">
                      <span>Total Recorded Visits:</span>
                      <span className="font-bold text-slate-900">{visitor.visit_count || visits.length || 1}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span>First Visit:</span>
                      <span className="font-medium text-slate-900">{visitor.first_visit_date || visitor.visit_date}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span>Last Visit:</span>
                      <span className="font-medium text-slate-900">{visitor.last_visit_date || visitor.visit_date}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Primary Service:</span>
                      <span className="font-medium text-slate-900">{visitor.service_attended || 'Sunday Service'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recorded Church Visits</h3>
                <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white text-xs" onClick={() => setShowLogVisitDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Record Return Visit
                </Button>
              </div>

              {visits.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border text-center text-slate-500 text-sm">
                  No additional return visits recorded yet. First visit was on {visitor.visit_date}.
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit, index) => (
                    <div key={visit.id || index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-sm">
                            {visit.service_attended || visitor.service_attended || 'Sunday Service'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{visit.visit_date}</span>
                        </div>
                        {visit.notes && <p className="text-xs text-slate-600 mt-1">{visit.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Follow-up Tasks & Care History</h3>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs" onClick={() => setShowAddFollowUpDialog(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Schedule Follow-up
                </Button>
              </div>

              {followUps.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border text-center text-slate-500 text-sm">
                  No follow-up tasks currently assigned for this visitor.
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps.map((fu) => (
                    <div key={fu.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{fu.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            fu.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {fu.status.toUpperCase()}
                          </span>
                        </div>
                        {fu.notes && <p className="text-xs text-slate-600">{fu.notes}</p>}
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                          <span>Due: {fu.due_date}</span>
                          {fu.outcome && <span className="text-sky-700 font-medium">Outcome: {fu.outcome}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4">
              <PastoralCareModule personId={visitor.id} personName={`${visitor.first_name} ${visitor.last_name}`} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4 bg-white p-6 rounded-xl border">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Visitor Engagement Timeline</h3>
              <div className="relative border-l-2 border-slate-200 pl-4 space-y-6 ml-2">
                {/* First Visit */}
                <div className="relative">
                  <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="text-xs font-semibold text-slate-900">First Visit Recorded</div>
                  <div className="text-[11px] text-slate-400">{visitor.first_visit_date || visitor.visit_date}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Attended {visitor.service_attended || 'Sunday Service'} (Invited by {visitor.invited_by || 'Self'}).
                  </div>
                </div>

                {/* Follow Ups */}
                {followUps.map((fu) => (
                  <div key={fu.id} className="relative">
                    <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                    <div className="text-xs font-semibold text-slate-900">{fu.title}</div>
                    <div className="text-[11px] text-slate-400">{fu.created_at?.split('T')[0] || fu.due_date}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Status: {fu.status} {fu.outcome ? `(${fu.outcome})` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t p-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Log Visit Modal */}
      <Dialog open={showLogVisitDialog} onOpenChange={setShowLogVisitDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleLogVisitSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Log Return Sunday Visit</DialogTitle>
              <DialogDescription className="text-xs">Record attendance for {visitor.first_name} {visitor.last_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Visit Date</label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Service Attended</label>
                <Input value={serviceAttended} onChange={(e) => setServiceAttended(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Notes / Feedback</label>
                <Input value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="e.g. Sat in row 3, expressed interest in small groups" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowLogVisitDialog(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-sky-600 text-white" disabled={submittingVisit}>
                {submittingVisit ? 'Saving...' : 'Record Visit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Follow-up Modal */}
      <Dialog open={showAddFollowUpDialog} onOpenChange={setShowAddFollowUpDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddFollowUpSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Schedule Guest Follow-up</DialogTitle>
              <DialogDescription className="text-xs">Create a pastoral or care check-in task for {visitor.first_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Task Title</label>
                <Input value={followUpTitle} onChange={(e) => setFollowUpTitle(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Due Date</label>
                <Input type="date" value={followUpDueDate} onChange={(e) => setFollowUpDueDate(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Follow-up Category</label>
                <Select value={followUpType} onValueChange={(val: any) => setFollowUpType(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_visitor">👋 New Visitor Welcome Call</SelectItem>
                    <SelectItem value="home_visit">🏡 Small Group / Cell Group Connect</SelectItem>
                    <SelectItem value="counseling">💬 Pastoral Check-in</SelectItem>
                    <SelectItem value="baptism">💧 Baptism / Membership Class</SelectItem>
                    <SelectItem value="prayer_request">🙏 Prayer Request Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Priority</label>
                <Select value={followUpPriority} onValueChange={(val: any) => setFollowUpPriority(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Notes</label>
                <Input value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="Action items or questions to ask" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddFollowUpDialog(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-indigo-600 text-white" disabled={submittingFollowUp}>
                {submittingFollowUp ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
