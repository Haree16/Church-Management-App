import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck2, Plus, QrCode, BarChart3, Users, Search, CheckCircle2, XCircle, Clock, Star, Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CanAccess } from '@/components/ui/can-access';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { DEMO_MEMBERS, DEMO_SETTINGS } from '@/lib/mockData';
import { AttendanceRecord, AttendanceStatus, ChurchMember } from '@/types/database';

// ─── Sub-components ────────────────────────────────────────────────────────────

type RosterEntry = { member: ChurchMember; status: AttendanceStatus | 'none' };

function StatusIcon({ status }: { status: AttendanceStatus | 'none' }) {
  if (status === 'present') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'absent') return <XCircle className="h-4 w-4" />;
  if (status === 'excused') return <Clock className="h-4 w-4" />;
  if (status === 'first_time_visitor') return <Star className="h-4 w-4" />;
  return null;
}

function statusColor(status: AttendanceStatus | 'none') {
  if (status === 'present') return 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600';
  if (status === 'absent') return 'bg-red-500 text-white border-red-500 hover:bg-red-600';
  if (status === 'excused') return 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600';
  if (status === 'first_time_visitor') return 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600';
  return 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
}

function cycleStatus(current: AttendanceStatus | 'none'): AttendanceStatus | 'none' {
  const cycle: (AttendanceStatus | 'none')[] = ['none', 'present', 'absent', 'excused'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}

function memberInitials(m: ChurchMember) {
  const name = m.profile?.display_name || '';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Fast Attendance Roster ─────────────────────────────────────────────────

function FastAttendanceRoster({ churchId, onSave }: { churchId: string; onSave?: (count: number) => void }) {
  const [search, setSearch] = useState('');
  const [roster, setRoster] = useState<Record<string, AttendanceStatus | 'none'>>({});
  const [selectedTimingId, setSelectedTimingId] = useState<string>(DEMO_SETTINGS.service_timings[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [history, setHistory] = useState<{ memberId: string; prev: AttendanceStatus | 'none' }[]>([]);

  const selectedTiming = DEMO_SETTINGS.service_timings.find((t) => t.id === selectedTimingId);

  const filtered = DEMO_MEMBERS.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.profile?.display_name?.toLowerCase().includes(q) ||
      m.profile?.email?.toLowerCase().includes(q) ||
      m.membership_number?.toLowerCase().includes(q)
    );
  });

  const setStatus = (memberId: string, status: AttendanceStatus | 'none') => {
    const prev = roster[memberId] || 'none';
    setHistory((h) => [...h.slice(-19), { memberId, prev }]);
    setRoster((r) => ({ ...r, [memberId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const snapshot = filtered.map((m) => ({ memberId: m.id, prev: roster[m.id] || 'none' as const }));
    setHistory((h) => [...h.slice(-20 + filtered.length), ...snapshot]);
    const update: Record<string, AttendanceStatus> = {};
    filtered.forEach((m) => (update[m.id] = status));
    setRoster((r) => ({ ...r, ...update }));
  };

  const undoLast = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRoster((r) => ({ ...r, [last.memberId]: last.prev }));
    setHistory((h) => h.slice(0, -1));
  };

  const counts = {
    present: Object.values(roster).filter((s) => s === 'present').length,
    absent: Object.values(roster).filter((s) => s === 'absent').length,
    excused: Object.values(roster).filter((s) => s === 'excused').length,
    visitor: Object.values(roster).filter((s) => s === 'first_time_visitor').length,
    total: Object.values(roster).filter((s) => s !== 'none').length,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(roster)
        .filter(([, status]) => status !== 'none')
        .map(([memberId, status]) => ({
          member_id: memberId,
          status: status as AttendanceStatus,
        }));

      if (records.length === 0) return;

      await attendanceService.bulkRecordAttendance(churchId, {
        session_name: selectedTiming?.name || 'Service',
        session_date: sessionDate,
        session_type: 'Sunday Service',
        service_timing_id: selectedTimingId,
        records,
      });

      setSavedCount(records.length);
      onSave?.(records.length);
    } catch (err) {
      console.error('Save attendance error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (savedCount !== null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">Attendance Saved!</p>
          <p className="text-sm text-slate-500 mt-1">{savedCount} records recorded for {selectedTiming?.name} on {sessionDate}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setRoster({}); setSavedCount(null); setHistory([]); }}>
            Start New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Session Picker */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Session Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Service</label>
            <select
              className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 dark:bg-slate-900 dark:border-slate-700"
              value={selectedTimingId}
              onChange={(e) => setSelectedTimingId(e.target.value)}
            >
              {DEMO_SETTINGS.service_timings.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="custom">Custom Session</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Date</label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div className="flex items-end gap-2">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {selectedTiming?.day} • {selectedTiming?.time}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Roster Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => markAll('present')}>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Mark All Present
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setRoster({})}>
          Clear All
        </Button>
        <Badge variant="secondary" className="font-mono text-xs">
          {counts.total} / {filtered.length} marked
        </Badge>
      </div>

      {/* Roster List */}
      <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((member) => {
          const status = roster[member.id] || 'none';
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {memberInitials(member)}
              </div>

              {/* Name & Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {member.profile?.display_name}
                </p>
                <p className="text-[10px] text-slate-500">{member.membership_number} • {member.role}</p>
              </div>

              {/* Quick Status Buttons */}
              <div className="flex items-center gap-1">
                {(['present', 'absent', 'excused'] as AttendanceStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(member.id, status === s ? 'none' : s)}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${status === s ? statusColor(s) : 'border-slate-200 text-slate-400 hover:border-slate-400 dark:border-slate-700'}`}
                  >
                    {s[0].toUpperCase()}
                  </button>
                ))}
                {/* Full cycle button */}
                <button
                  onClick={() => setStatus(member.id, cycleStatus(status))}
                  className={`h-7 px-2.5 rounded-md border flex items-center gap-1 text-[11px] font-semibold transition-all ${statusColor(status)}`}
                >
                  <StatusIcon status={status} />
                  {status === 'none' ? 'Tap' : status.replace('_', ' ')}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            No members match your search.
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{counts.present} Present</span>
          <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" />{counts.absent} Absent</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" />{counts.excused} Excused</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={undoLast} disabled={history.length === 0}>
            <RotateCcw className="h-3.5 w-3.5" /> Undo
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving || counts.total === 0}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Attendance
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── QR Kiosk ──────────────────────────────────────────────────────────────

function QRKiosk({ churchId }: { churchId: string }) {
  const [mode, setMode] = useState<'kiosk' | 'qr'>('kiosk');
  const [search, setSearch] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [selectedTimingId, setSelectedTimingId] = useState(DEMO_SETTINGS.service_timings[1]?.id || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ name: string; isVisitor: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<{ name: string; time: string; isVisitor: boolean }[]>([]);

  const selectedTiming = DEMO_SETTINGS.service_timings.find((t) => t.id === selectedTimingId);

  const doCheckin = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await attendanceService.processQRCheckin(churchId, {
        phone_or_email: term,
        service_name: selectedTiming?.name || 'Service',
        service_date: new Date().toISOString().split('T')[0],
        service_timing_id: selectedTimingId,
      });
      setSuccess({ name: result.attendeeName, isVisitor: result.isVisitor });
      setRecentCheckins((prev) => [
        { name: result.attendeeName, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isVisitor: result.isVisitor },
        ...prev.slice(0, 4),
      ]);
      setSearch('');
      setQrInput('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Check-in failed. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit QR when long enough
  useEffect(() => {
    if (qrInput.length >= 12) {
      doCheckin(qrInput);
    }
  }, [qrInput]);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Service Selector */}
      <Card>
        <CardContent className="pt-4 pb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Service</label>
            <select
              className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 dark:bg-slate-900 dark:border-slate-700"
              value={selectedTimingId}
              onChange={(e) => setSelectedTimingId(e.target.value)}
            >
              {DEMO_SETTINGS.service_timings.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Badge variant="secondary" className="text-xs">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setMode('kiosk')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${mode === 'kiosk' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
        >
          <Search className="h-3.5 w-3.5" /> Self Check-In
        </button>
        <button
          onClick={() => setMode('qr')}
          className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${mode === 'qr' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
        >
          <QrCode className="h-3.5 w-3.5" /> QR Scanner
        </button>
      </div>

      {/* Success Card */}
      {success && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-5 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-300">Checked In!</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{success.name}{success.isVisitor ? ' (Visitor)' : ''}</p>
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-5 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Kiosk Mode */}
      {mode === 'kiosk' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-center">Welcome! 👋</CardTitle>
            <CardDescription className="text-center text-xs">Enter your name, phone, email, or member ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Name, phone, email, or member ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doCheckin(search)}
                className="flex-1"
                autoFocus
                disabled={loading}
              />
              <Button onClick={() => doCheckin(search)} disabled={loading || !search.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Mode */}
      {mode === 'qr' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center gap-3">
              <QrCode className="h-16 w-16 text-slate-400" />
              <p className="text-xs text-center text-slate-500">
                Present your QR code to the scanner or USB reader below
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">QR Code / Scanner Input</label>
              <Input
                placeholder="Auto-submits when scanned..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doCheckin(qrInput)}
                autoFocus
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
            {loading && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</div>}
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {recentCheckins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentCheckins.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                  {c.isVisitor && <Badge variant="secondary" className="text-[10px] py-0">Visitor</Badge>}
                </div>
                <span className="text-slate-400 font-mono">{c.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Attendance Analytics ───────────────────────────────────────────────────

function AttendanceAnalytics({ churchId }: { churchId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      attendanceService.getAttendanceStats(churchId),
      attendanceService.getAttendanceReports(churchId),
    ]).then(([s, r]) => {
      setStats(s);
      setReports(r);
    }).finally(() => setLoading(false));
  }, [churchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const kpis = [
    { label: 'Total Attendees', value: stats?.totalAttendees || 0, icon: <Users className="h-4 w-4" />, color: 'text-sky-600' },
    { label: 'Weekly Average', value: stats?.weeklyAverage || 0, icon: <BarChart3 className="h-4 w-4" />, color: 'text-indigo-600' },
    { label: 'First-Time Visitors', value: stats?.firstTimeVisitors || 0, icon: <Star className="h-4 w-4" />, color: 'text-amber-600' },
    { label: 'QR / Digital Check-ins', value: stats?.qrScansCount || 0, icon: <QrCode className="h-4 w-4" />, color: 'text-emerald-600' },
  ];

  const maxCount = Math.max(...(reports?.serviceBreakdown || []).map((s: any) => s.count), 1);

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-4 pb-3">
              <div className={`flex items-center gap-2 mb-1.5 ${k.color}`}>
                {k.icon}
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-500" /> Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports?.dailyTrends?.length > 0 ? (
              <div className="space-y-2">
                {reports.dailyTrends.map((d: any) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 w-20 shrink-0 font-mono">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all"
                        style={{ width: `${Math.min((d.present / Math.max(d.total, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{d.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No attendance data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-indigo-500" /> By Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports?.serviceBreakdown?.map((s: any) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">{s.name}</span>
                  <span className="text-slate-500 font-mono">{s.count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {!reports?.serviceBreakdown?.length && (
              <p className="text-xs text-slate-400 text-center py-6">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Attendance Page ───────────────────────────────────────────────────

export function AttendancePage() {
  const { activeChurch } = useAuth();
  const [activeTab, setActiveTab] = useState('roster');
  const [savedMsg, setSavedMsg] = useState('');

  const churchId = activeChurch?.id || 'a0000000-0000-0000-0000-000000000001';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Attendance Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fast roster marking, QR check-in kiosk, and attendance analytics & reports.
          </p>
        </div>
        {savedMsg && (
          <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-50">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {savedMsg}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="roster" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Attendance Roster
          </TabsTrigger>
          <TabsTrigger value="kiosk" className="text-xs gap-1.5">
            <QrCode className="h-3.5 w-3.5" /> QR Check-in Kiosk
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <CanAccess permission="attendance:record">
            <FastAttendanceRoster
              churchId={churchId}
              onSave={(count) => {
                setSavedMsg(`${count} records saved!`);
                setTimeout(() => setSavedMsg(''), 5000);
              }}
            />
          </CanAccess>
        </TabsContent>

        <TabsContent value="kiosk">
          <QRKiosk churchId={churchId} />
        </TabsContent>

        <TabsContent value="analytics">
          <AttendanceAnalytics churchId={churchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
