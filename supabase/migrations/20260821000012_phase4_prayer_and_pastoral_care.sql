-- =============================================================================
-- Church Management System (CMS) - Phase 4 Continuation: Prayer Requests & Pastoral Care
-- 20260821000012_phase4_prayer_and_pastoral_care.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND PRAYER REQUESTS TABLE FOR TESTIMONIES & MODERATION
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.prayer_requests
    ADD COLUMN IF NOT EXISTS testimony_notes TEXT,
    ADD COLUMN IF NOT EXISTS testimony_permission TEXT NOT NULL DEFAULT 'private',
    ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_moderation ON public.prayer_requests(church_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_category ON public.prayer_requests(church_id, category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PASTORAL CARE TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pastoral_care (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    person_id UUID, -- Member ID or Visitor ID if linked
    person_type TEXT NOT NULL DEFAULT 'member', -- 'member' | 'visitor'
    person_name TEXT NOT NULL,
    person_email TEXT,
    person_phone TEXT,
    care_type TEXT NOT NULL DEFAULT 'pastoral_visit', -- 'pastoral_visit' | 'counseling' | 'hospital_visit' | 'bereavement' | 'crisis' | 'general_checkin'
    stage TEXT NOT NULL DEFAULT 'initial_contact', -- 'initial_contact' | 'in_progress' | 'scheduled_followup' | 'resolved' | 'referred'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_name TEXT,
    confidentiality_level TEXT NOT NULL DEFAULT 'pastor_only', -- 'pastor_only' | 'pastoral_team' | 'care_leaders'
    summary TEXT NOT NULL,
    private_notes TEXT,
    safeguarding_flag BOOLEAN DEFAULT false,
    safeguarding_notes TEXT,
    due_date DATE,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pastoral_care ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pastoral_care_church ON public.pastoral_care(church_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_care_person ON public.pastoral_care(church_id, person_id);
CREATE INDEX IF NOT EXISTS idx_pastoral_care_assigned ON public.pastoral_care(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pastoral_care_stage ON public.pastoral_care(church_id, stage);
CREATE INDEX IF NOT EXISTS idx_pastoral_care_confidentiality ON public.pastoral_care(church_id, confidentiality_level);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PASTORAL CARE TIMELINE LOGS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pastoral_care_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    pastoral_care_id UUID NOT NULL REFERENCES public.pastoral_care(id) ON DELETE CASCADE,
    contact_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contact_method TEXT NOT NULL DEFAULT 'in_person', -- 'phone_call' | 'in_person' | 'home_visit' | 'hospital_visit' | 'video_call' | 'text_sms'
    notes TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT,
    next_action TEXT,
    next_action_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pastoral_care_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pastoral_care_logs_case ON public.pastoral_care_logs(pastoral_care_id, contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_pastoral_care_logs_church ON public.pastoral_care_logs(church_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY POLICIES FOR PASTORAL CARE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "pastoral_care_select_policy" ON public.pastoral_care
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR (
            assigned_to = auth.uid()
        )
        OR (
            confidentiality_level IN ('pastoral_team', 'care_leaders')
            AND public.has_church_role(church_id, ARRAY['pastor', 'church_admin', 'ministry_leader']::public.user_role[])
        )
    );

CREATE POLICY "pastoral_care_insert_policy" ON public.pastoral_care
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.has_church_role(church_id, ARRAY['pastor', 'church_admin', 'ministry_leader']::public.user_role[])
    );

CREATE POLICY "pastoral_care_update_policy" ON public.pastoral_care
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR assigned_to = auth.uid()
    );

CREATE POLICY "pastoral_care_delete_policy" ON public.pastoral_care
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- Pastoral Care Logs RLS
CREATE POLICY "pastoral_care_logs_select_policy" ON public.pastoral_care_logs
    FOR SELECT USING (
        pastoral_care_id IN (SELECT id FROM public.pastoral_care)
    );

CREATE POLICY "pastoral_care_logs_insert_policy" ON public.pastoral_care_logs
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR author_id = auth.uid()
    );
