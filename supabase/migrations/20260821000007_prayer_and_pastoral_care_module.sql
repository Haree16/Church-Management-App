-- =============================================================================
-- Church Management System (CMS) - Phase 5: Prayer Requests & Pastoral Care
-- 20260821000007_prayer_and_pastoral_care_module.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR PRAYER & FOLLOW-UPS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE public.prayer_privacy AS ENUM (
        'private',
        'pastor_only',
        'prayer_team',
        'church_wide'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.prayer_status AS ENUM (
        'new',
        'praying',
        'answered',
        'closed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.follow_up_type AS ENUM (
        'new_visitor',
        'new_member',
        'baptism',
        'counseling',
        'hospital_visit',
        'home_visit',
        'prayer_request',
        'missing_member',
        'new_family',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.contact_method AS ENUM (
        'phone_call',
        'in_person',
        'home_visit',
        'hospital_visit',
        'email',
        'text_sms',
        'video_call',
        'meeting',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EXTEND PRAYER REQUESTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.prayer_requests
    ADD COLUMN IF NOT EXISTS privacy public.prayer_privacy NOT NULL DEFAULT 'church_wide',
    ADD COLUMN IF NOT EXISTS status public.prayer_status NOT NULL DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS prayed_user_ids UUID[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS author_email TEXT,
    ADD COLUMN IF NOT EXISTS author_phone TEXT;

-- Convert existing boolean is_confidential to privacy if applicable
UPDATE public.prayer_requests
SET privacy = 'pastor_only'
WHERE is_confidential = true AND privacy = 'church_wide';

UPDATE public.prayer_requests
SET status = 'answered'
WHERE is_answered = true AND status = 'new';

-- Indexes for prayer requests
CREATE INDEX IF NOT EXISTS idx_prayer_requests_privacy ON public.prayer_requests(church_id, privacy);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON public.prayer_requests(church_id, status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_assigned_to ON public.prayer_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_assigned_team ON public.prayer_requests(assigned_team_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRAYER NOTES TABLE (Timeline / Updates)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prayer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    prayer_request_id UUID NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT DEFAULT 'Prayer Warrior',
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayer_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prayer_notes_request ON public.prayer_notes(prayer_request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_prayer_notes_church ON public.prayer_notes(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. EXTEND FOLLOW-UPS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.follow_ups
    ADD COLUMN IF NOT EXISTS type public.follow_up_type NOT NULL DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS person_name TEXT,
    ADD COLUMN IF NOT EXISTS person_phone TEXT,
    ADD COLUMN IF NOT EXISTS person_email TEXT,
    ADD COLUMN IF NOT EXISTS prayer_request_id UUID REFERENCES public.prayer_requests(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_follow_ups_type ON public.follow_ups(church_id, type);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(church_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_priority ON public.follow_ups(church_id, priority);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON public.follow_ups(church_id, due_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FOLLOW-UP HISTORY TABLE (Audit Trail & Interaction Logs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.follow_up_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    follow_up_id UUID NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
    contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    person_contacted TEXT NOT NULL,
    contact_method public.contact_method NOT NULL DEFAULT 'phone_call',
    notes TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    next_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.follow_up_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_follow_up_history_fu ON public.follow_up_history(follow_up_id, contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_history_church ON public.follow_up_history(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY POLICIES & HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper function to check if current user is part of a prayer team or ministry
CREATE OR REPLACE FUNCTION public.is_prayer_team_member(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.church_members cm
        JOIN public.ministries m ON m.id = cm.ministry_id
        WHERE cm.user_id = auth.uid()
          AND cm.church_id = target_church_id
          AND (m.name ILIKE '%prayer%' OR m.name ILIKE '%intercess%' OR cm.role IN ('pastor', 'church_admin', 'ministry_leader'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop old policies on prayer_requests to upgrade them with granular privacy
DROP POLICY IF EXISTS "prayers_select_policy" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayers_insert_policy" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayers_update_policy" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayers_delete_policy" ON public.prayer_requests;

-- New Prayer Requests Select Policy
-- Super admins & Pastors & Church Admins: full access
-- Prayer Team: access church_wide, prayer_team, or requests assigned to their team / self
-- General Members / Volunteers: access church_wide OR their own submitted requests (even private/pastor_only)
CREATE POLICY "prayer_requests_select_policy" ON public.prayer_requests
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR (
            -- Assigned directly to current user
            assigned_to = auth.uid()
        )
        OR (
            -- Submitted by current user
            member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
        )
        OR (
            -- Church-wide prayers accessible to all verified church members
            privacy = 'church_wide' AND public.is_church_member(church_id)
        )
        OR (
            -- Prayer team privacy accessible to prayer team members & leaders
            privacy = 'prayer_team' AND (
                public.is_prayer_team_member(church_id)
                OR public.has_church_role(church_id, ARRAY['pastor', 'church_admin', 'ministry_leader']::public.user_role[])
            )
        )
    );

CREATE POLICY "prayer_requests_insert_policy" ON public.prayer_requests
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "prayer_requests_update_policy" ON public.prayer_requests
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR assigned_to = auth.uid()
        OR (
            -- Prayer team can update status / notes on prayer_team or church_wide items
            (privacy IN ('church_wide', 'prayer_team')) AND public.is_prayer_team_member(church_id)
        )
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );

CREATE POLICY "prayer_requests_delete_policy" ON public.prayer_requests
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );

-- Prayer Notes RLS
CREATE POLICY "prayer_notes_select_policy" ON public.prayer_notes
    FOR SELECT USING (
        prayer_request_id IN (SELECT id FROM public.prayer_requests)
    );

CREATE POLICY "prayer_notes_insert_policy" ON public.prayer_notes
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_prayer_team_member(church_id)
        OR author_id = auth.uid()
    );

-- Follow-ups RLS update
DROP POLICY IF EXISTS "follow_ups_select_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "follow_ups_insert_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "follow_ups_update_policy" ON public.follow_ups;
DROP POLICY IF EXISTS "follow_ups_delete_policy" ON public.follow_ups;

CREATE POLICY "follow_ups_select_policy" ON public.follow_ups
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR assigned_to = auth.uid()
        OR (
            -- Group leaders can view follow ups for members in their group
            public.has_church_role(church_id, ARRAY['group_leader']::public.user_role[])
            AND member_id IN (
                SELECT cm.id FROM public.church_members cm
                JOIN public.groups g ON g.id = cm.group_id
                WHERE g.leader_id = auth.uid() OR g.co_leader_id = auth.uid()
            )
        )
        OR (
            -- Ministry leaders can view follow ups for members in their ministry
            public.has_church_role(church_id, ARRAY['ministry_leader']::public.user_role[])
            AND member_id IN (
                SELECT cm.id FROM public.church_members cm
                JOIN public.ministries m ON m.id = cm.ministry_id
                WHERE m.leader_id = auth.uid() OR m.assistant_leader_id = auth.uid()
            )
        )
    );

CREATE POLICY "follow_ups_insert_policy" ON public.follow_ups
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "follow_ups_update_policy" ON public.follow_ups
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR assigned_to = auth.uid()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "follow_ups_delete_policy" ON public.follow_ups
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- Follow-up History RLS
CREATE POLICY "follow_up_history_select_policy" ON public.follow_up_history
    FOR SELECT USING (
        follow_up_id IN (SELECT id FROM public.follow_ups)
    );

CREATE POLICY "follow_up_history_insert_policy" ON public.follow_up_history
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR user_id = auth.uid()
    );
