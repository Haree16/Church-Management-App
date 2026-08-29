-- ==============================================================================
-- Church Management System (CMS) - Phase 2: People Management Module
-- 20260821000004_people_module.sql
-- ==============================================================================

-- 1. Extend member_status enum if needed
DO $$ BEGIN
    ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'transferred';
    ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'moved_away';
EXCEPTION
    WHEN others THEN null;
END $$;

-- 2. Visitor Status Enum
DO $$ BEGIN
    CREATE TYPE public.visitor_status AS ENUM (
        'new',
        'contacted',
        'follow_up_required',
        'connected',
        'became_member',
        'not_interested'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Marital Status Enum
DO $$ BEGIN
    CREATE TYPE public.marital_status AS ENUM (
        'single',
        'married',
        'widowed',
        'divorced',
        'separated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Follow-up Priority & Type Enum
DO $$ BEGIN
    CREATE TYPE public.follow_up_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.follow_up_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 5. UPDATE PROFILES & CHURCH_MEMBERS FIELDS
-- ==============================================================================
-- Add personal and spiritual milestones to profiles / church_members
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', '')),
    ADD COLUMN IF NOT EXISTS dob DATE,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
    ADD COLUMN IF NOT EXISTS marital_status marital_status DEFAULT 'single',
    ADD COLUMN IF NOT EXISTS marriage_date DATE,
    ADD COLUMN IF NOT EXISTS occupation TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE public.church_members
    ADD COLUMN IF NOT EXISTS baptism_date DATE,
    ADD COLUMN IF NOT EXISTS salvation_date DATE,
    ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS previous_church TEXT,
    ADD COLUMN IF NOT EXISTS ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_church_members_ministry_id ON public.church_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_church_members_group_id ON public.church_members(group_id);
CREATE INDEX IF NOT EXISTS idx_church_members_family_id ON public.church_members(family_id);

-- ==============================================================================
-- 6. VISITORS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_attended TEXT,
    invited_by TEXT,
    heard_about TEXT,
    family_size INTEGER DEFAULT 1,
    prayer_request TEXT,
    notes TEXT,
    status visitor_status NOT NULL DEFAULT 'new',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted_member_id UUID REFERENCES public.church_members(id) ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitors_church_id ON public.visitors(church_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(church_id, status);
CREATE INDEX IF NOT EXISTS idx_visitors_visit_date ON public.visitors(church_id, visit_date DESC);

CREATE TRIGGER trigger_visitors_updated_at
    BEFORE UPDATE ON public.visitors
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 7. FOLLOW-UPS TABLE (Pastoral & Visitor Follow-ups)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    notes TEXT,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    priority follow_up_priority NOT NULL DEFAULT 'medium',
    status follow_up_status NOT NULL DEFAULT 'pending',
    outcome TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_church_id ON public.follow_ups(church_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_visitor_id ON public.follow_ups(visitor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_member_id ON public.follow_ups(member_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON public.follow_ups(assigned_to);

CREATE TRIGGER trigger_follow_ups_updated_at
    BEFORE UPDATE ON public.follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 8. ATTENDANCE RECORDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE CASCADE,
    service_timing_id TEXT,
    service_name TEXT NOT NULL,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_in_type TEXT DEFAULT 'in_person', -- 'in_person', 'kiosk', 'online', 'headcount'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_member ON public.attendance_records(member_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_church_date ON public.attendance_records(church_id, service_date DESC);

-- ==============================================================================
-- 9. DONATIONS & CONTRIBUTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE SET NULL,
    donor_name TEXT,
    donor_email TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    fund_name TEXT NOT NULL DEFAULT 'General Tithes & Offerings',
    payment_method TEXT DEFAULT 'online_card', -- 'online_card', 'ach', 'cash', 'check', 'other'
    reference_number TEXT,
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'refunded'
    is_tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_church_member ON public.donations(church_id, member_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_fund ON public.donations(church_id, fund_name);

-- ==============================================================================
-- 10. PRAYER REQUESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    request TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'healing', 'family', 'salvation', 'finance', 'praise', 'general'
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    praise_report TEXT,
    prayer_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_church ON public.prayer_requests(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_member ON public.prayer_requests(member_id);

CREATE TRIGGER trigger_prayer_requests_updated_at
    BEFORE UPDATE ON public.prayer_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 11. RLS POLICIES FOR NEW TABLES
-- ==============================================================================
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- Visitors RLS
CREATE POLICY "visitors_select_policy" ON public.visitors
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "visitors_insert_policy" ON public.visitors
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR public.has_church_role(church_id, ARRAY['volunteer']::public.user_role[])
    );

CREATE POLICY "visitors_update_policy" ON public.visitors
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    ) WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "visitors_delete_policy" ON public.visitors
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- Follow-ups RLS
CREATE POLICY "follow_ups_select_policy" ON public.follow_ups
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR assigned_to = auth.uid()
    );

CREATE POLICY "follow_ups_insert_policy" ON public.follow_ups
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "follow_ups_update_policy" ON public.follow_ups
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR assigned_to = auth.uid()
    );

CREATE POLICY "follow_ups_delete_policy" ON public.follow_ups
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- Attendance RLS
CREATE POLICY "attendance_select_policy" ON public.attendance_records
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );

CREATE POLICY "attendance_insert_policy" ON public.attendance_records
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR public.has_church_role(church_id, ARRAY['volunteer']::public.user_role[])
    );

-- Donations RLS
CREATE POLICY "donations_select_policy" ON public.donations
    FOR SELECT USING (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin', 'pastor']::public.user_role[])
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );

CREATE POLICY "donations_insert_policy" ON public.donations
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin', 'pastor']::public.user_role[])
    );

-- Prayer Requests RLS
CREATE POLICY "prayers_select_policy" ON public.prayer_requests
    FOR SELECT USING (
        public.is_super_admin()
        OR (public.is_church_member(church_id) AND NOT is_confidential)
        OR (public.is_church_admin_or_pastor(church_id) AND is_confidential)
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );

CREATE POLICY "prayers_insert_policy" ON public.prayer_requests
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "prayers_update_policy" ON public.prayer_requests
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR member_id IN (SELECT id FROM public.church_members WHERE user_id = auth.uid())
    );
