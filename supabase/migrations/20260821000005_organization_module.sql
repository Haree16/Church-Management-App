-- ==============================================================================
-- Church Management System (CMS) - Phase 3: Church Organization Module
-- 20260821000005_organization_module.sql
-- ==============================================================================

-- 1. Status Enums
DO $$ BEGIN
    CREATE TYPE public.org_status AS ENUM ('active', 'inactive', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.volunteer_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.assignment_status AS ENUM ('scheduled', 'confirmed', 'declined', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Extend ministries table
ALTER TABLE public.ministries
    ADD COLUMN IF NOT EXISTS assistant_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status org_status NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS meeting_schedule TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. MINISTRY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.ministry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member', -- e.g. 'Director', 'Worship Leader', 'Vocalist', 'Musician', 'Teacher', 'Member'
    status org_status NOT NULL DEFAULT 'active',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ministry_user UNIQUE (ministry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ministry_members_church ON public.ministry_members(church_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry ON public.ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_user ON public.ministry_members(user_id);

CREATE TRIGGER trigger_ministry_members_updated_at
    BEFORE UPDATE ON public.ministry_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Extend groups table
ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS assistant_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status org_status NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 5. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Member', -- 'Leader', 'Co-Leader', 'Host', 'Member'
    status org_status NOT NULL DEFAULT 'active',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_church ON public.group_members(church_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

CREATE TRIGGER trigger_group_members_updated_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. GROUP ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.group_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    topic TEXT,
    notes TEXT,
    attendee_ids UUID[] DEFAULT '{}',
    total_present INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_attendance_church ON public.group_attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_group_attendance_group ON public.group_attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_group_attendance_date ON public.group_attendance(group_id, session_date);

-- 7. GROUP ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.group_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_announcements_group ON public.group_announcements(group_id);

-- 8. MINISTRY EVENTS & REHEARSALS TABLE
CREATE TABLE IF NOT EXISTS public.ministry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TEXT NOT NULL DEFAULT '06:30 PM',
    end_time TEXT DEFAULT '08:30 PM',
    location TEXT NOT NULL DEFAULT 'Main Sanctuary Stage',
    type TEXT NOT NULL DEFAULT 'rehearsal', -- 'rehearsal', 'meeting', 'service', 'workshop', 'outreach'
    attendee_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministry_events_ministry ON public.ministry_events(ministry_id);

-- 9. VOLUNTEERS TABLE
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.church_members(id) ON DELETE CASCADE,
    skills TEXT[] DEFAULT '{}',
    availability TEXT[] DEFAULT '{"Sunday Morning"}',
    preferred_service TEXT,
    status volunteer_status NOT NULL DEFAULT 'active',
    background_check_status TEXT DEFAULT 'approved', -- 'approved', 'pending', 'not_required'
    background_check_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_volunteer_user UNIQUE (church_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_church ON public.volunteers(church_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_user ON public.volunteers(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers(church_id, status);

CREATE TRIGGER trigger_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 10. VOLUNTEER ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    service_timing_id TEXT,
    event_name TEXT NOT NULL,
    assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TEXT NOT NULL DEFAULT '09:00 AM',
    end_time TEXT DEFAULT '12:30 PM',
    location TEXT DEFAULT 'Main Sanctuary',
    responsibility TEXT NOT NULL, -- e.g. 'Front Door Greeter', 'Lead Vocals', 'Audio Engineer', 'Nursery Care'
    status assignment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_church ON public.volunteer_assignments(church_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON public.volunteer_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_ministry ON public.volunteer_assignments(ministry_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON public.volunteer_assignments(church_id, assignment_date);

CREATE TRIGGER trigger_volunteer_assignments_updated_at
    BEFORE UPDATE ON public.volunteer_assignments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- Helper: Check if user leads this specific ministry
CREATE OR REPLACE FUNCTION public.is_ministry_leader_of(target_ministry_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN RETURN TRUE; END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.ministries
        WHERE id = target_ministry_id AND (leader_id = auth.uid() OR assistant_leader_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Check if user leads this specific group
CREATE OR REPLACE FUNCTION public.is_group_leader_of(target_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN RETURN TRUE; END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.groups
        WHERE id = target_group_id AND (leader_id = auth.uid() OR co_leader_id = auth.uid() OR assistant_leader_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ministry Members RLS
CREATE POLICY "ministry_members_select" ON public.ministry_members
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "ministry_members_insert" ON public.ministry_members
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );

CREATE POLICY "ministry_members_update" ON public.ministry_members
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );

CREATE POLICY "ministry_members_delete" ON public.ministry_members
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );

-- Group Members RLS
CREATE POLICY "group_members_select" ON public.group_members
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "group_members_insert" ON public.group_members
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

CREATE POLICY "group_members_update" ON public.group_members
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

CREATE POLICY "group_members_delete" ON public.group_members
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

-- Group Attendance RLS
CREATE POLICY "group_attendance_select" ON public.group_attendance
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "group_attendance_insert" ON public.group_attendance
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

-- Group Announcements RLS
CREATE POLICY "group_announcements_select" ON public.group_announcements
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "group_announcements_insert" ON public.group_announcements
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_group_leader_of(group_id)
    );

-- Ministry Events RLS
CREATE POLICY "ministry_events_select" ON public.ministry_events
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

CREATE POLICY "ministry_events_insert" ON public.ministry_events
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR public.is_ministry_leader_of(ministry_id)
    );

-- Volunteers RLS
CREATE POLICY "volunteers_select" ON public.volunteers
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR user_id = auth.uid()
    );

CREATE POLICY "volunteers_insert" ON public.volunteers
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "volunteers_update" ON public.volunteers
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR user_id = auth.uid()
    );

CREATE POLICY "volunteers_delete" ON public.volunteers
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- Volunteer Assignments RLS
CREATE POLICY "volunteer_assignments_select" ON public.volunteer_assignments
    FOR SELECT USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
    );

CREATE POLICY "volunteer_assignments_insert" ON public.volunteer_assignments
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "volunteer_assignments_update" ON public.volunteer_assignments
    FOR UPDATE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR volunteer_id IN (SELECT id FROM public.volunteers WHERE user_id = auth.uid())
    );

CREATE POLICY "volunteer_assignments_delete" ON public.volunteer_assignments
    FOR DELETE USING (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

