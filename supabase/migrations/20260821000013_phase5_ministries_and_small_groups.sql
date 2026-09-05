-- =============================================================================
-- Church Management System (CMS) - Phase 5: Ministries & Small Groups / Cell Groups
-- 20260821000013_phase5_ministries_and_small_groups.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND GROUPS TABLE FOR TERMINOLOGY & RECURRING SCHEDULES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS terminology TEXT DEFAULT 'Small Group',
    ADD COLUMN IF NOT EXISTS meeting_frequency TEXT DEFAULT 'weekly',
    ADD COLUMN IF NOT EXISTS meeting_time TEXT,
    ADD COLUMN IF NOT EXISTS meeting_day TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'General';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GROUP MEETINGS TABLE (Scheduled & Completed Session Records)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TEXT DEFAULT '07:00 PM',
    end_time TEXT DEFAULT '08:30 PM',
    topic TEXT,
    scripture_reference TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'scheduled' | 'completed' | 'cancelled'
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.group_meetings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_group_meetings_group ON public.group_meetings(group_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_group_meetings_church ON public.group_meetings(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. GROUP MEMBER HISTORY TABLE (Auditable Participation Timeline)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.group_member_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.church_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member', -- 'Leader' | 'Co-Leader' | 'Host' | 'Member' | 'Coordinator'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'left'
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    left_date DATE,
    reason_left TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.group_member_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_group_member_history_group ON public.group_member_history(group_id, member_id);
CREATE INDEX IF NOT EXISTS idx_group_member_history_church ON public.group_member_history(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MINISTRY MEMBER HISTORY TABLE (Auditable Ministry Participation)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ministry_member_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.church_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member', -- 'Leader' | 'Assistant Leader' | 'Volunteer' | 'Coordinator' | 'Member'
    status TEXT NOT NULL DEFAULT 'active',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    left_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ministry_member_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ministry_member_history_min ON public.ministry_member_history(ministry_id, member_id);
CREATE INDEX IF NOT EXISTS idx_ministry_member_history_church ON public.ministry_member_history(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY POLICIES FOR PHASE 5
-- ─────────────────────────────────────────────────────────────────────────────

-- Group Meetings RLS
CREATE POLICY "group_meetings_select" ON public.group_meetings
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
        OR (
            -- Group members can view their group meetings
            group_id IN (
                SELECT gm.group_id FROM public.group_members gm
                JOIN public.profiles p ON p.id = gm.user_id
                WHERE p.id = auth.uid()
            )
        )
    );

CREATE POLICY "group_meetings_insert" ON public.group_meetings
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

CREATE POLICY "group_meetings_update" ON public.group_meetings
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

CREATE POLICY "group_meetings_delete" ON public.group_meetings
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

-- Group Member History RLS
CREATE POLICY "group_member_history_select" ON public.group_member_history
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

CREATE POLICY "group_member_history_insert" ON public.group_member_history
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

-- Ministry Member History RLS
CREATE POLICY "ministry_member_history_select" ON public.ministry_member_history
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );

CREATE POLICY "ministry_member_history_insert" ON public.ministry_member_history
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );
