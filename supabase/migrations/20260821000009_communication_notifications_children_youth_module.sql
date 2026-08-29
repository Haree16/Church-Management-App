-- ==============================================================================
-- Migration: 20260821000009_communication_notifications_children_youth_module.sql
-- Description: Phase 7 Announcements, Multi-Channel Communication, Notifications,
--              Children Ministry (Classes, Check-in, Privacy) & Youth Ministry
-- ==============================================================================

-- 1. Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE announcement_audience AS ENUM (
        'everyone',
        'members',
        'ministry',
        'group',
        'volunteers',
        'youth',
        'parents',
        'new_members'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE announcement_status AS ENUM (
        'draft',
        'published',
        'scheduled',
        'expired',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM (
        'normal',
        'important',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_channel AS ENUM (
        'email',
        'sms',
        'whatsapp',
        'push',
        'in_app'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_category AS ENUM (
        'new_visitor',
        'new_prayer_request',
        'follow_up_due',
        'follow_up_overdue',
        'event_reminder',
        'volunteer_assignment',
        'announcement',
        'system_notification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE child_gender AS ENUM (
        'male',
        'female',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE child_status AS ENUM (
        'active',
        'graduated',
        'inactive'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE child_attendance_status AS ENUM (
        'checked_in',
        'checked_out',
        'absent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE youth_status AS ENUM (
        'active',
        'graduated',
        'alumni',
        'inactive'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. ANNOUNCEMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT,
    audience announcement_audience NOT NULL DEFAULT 'everyone',
    target_ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    target_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    priority announcement_priority NOT NULL DEFAULT 'normal',
    channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
    publish_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    status announcement_status NOT NULL DEFAULT 'published',
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_church_status ON public.announcements(church_id, status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON public.announcements(church_id, audience);

CREATE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 3. COMMUNICATION CAMPAIGNS & LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    channel communication_channel NOT NULL,
    audience_type announcement_audience NOT NULL DEFAULT 'everyone',
    subject TEXT,
    content TEXT NOT NULL,
    sender_name TEXT,
    sender_email TEXT,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_campaigns_church ON public.communication_campaigns(church_id, channel, status);

-- ==============================================================================
-- 4. CHILDREN'S CLASSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.children_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    age_range_min INTEGER NOT NULL DEFAULT 0,
    age_range_max INTEGER NOT NULL DEFAULT 12,
    room_number TEXT,
    max_capacity INTEGER,
    lead_teacher_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    lead_teacher_name TEXT,
    color TEXT DEFAULT '#10b981',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_classes_church ON public.children_classes(church_id, is_active);

-- ==============================================================================
-- 5. CHILDREN TABLE (Strict Child Privacy)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    child_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender child_gender NOT NULL DEFAULT 'male',
    parent_guardian_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    class_id UUID REFERENCES public.children_classes(id) ON DELETE SET NULL,
    class_name TEXT,
    allergies_medical_notes TEXT,
    security_pin TEXT,
    photo_url TEXT,
    status child_status NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_church_class ON public.children(church_id, class_id, status);
CREATE INDEX IF NOT EXISTS idx_children_parent ON public.children(parent_guardian_id);

CREATE TRIGGER trigger_children_updated_at
    BEFORE UPDATE ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 6. CHILDREN ATTENDANCE & CHECK-IN
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.children_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.children_classes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    checked_in_by TEXT,
    checked_out_by TEXT,
    status child_attendance_status NOT NULL DEFAULT 'checked_in',
    security_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_att_church_date ON public.children_attendance(church_id, session_date);
CREATE INDEX IF NOT EXISTS idx_children_att_child ON public.children_attendance(child_id);

-- ==============================================================================
-- 7. YOUTH MANAGEMENT TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.youth_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    grade TEXT,
    school_name TEXT,
    date_of_birth DATE,
    gender child_gender NOT NULL DEFAULT 'male',
    phone TEXT,
    email TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    parent_email TEXT,
    emergency_contact TEXT,
    baptism_status TEXT DEFAULT 'not_baptized',
    mentor_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    mentor_name TEXT,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    status youth_status NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youth_church ON public.youth_profiles(church_id, status);

CREATE TABLE IF NOT EXISTS public.youth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'Youth Night',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    lead_leader_name TEXT,
    target_grades TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youth_events ENABLE ROW LEVEL SECURITY;

-- Announcements RLS
CREATE POLICY "Anyone in church can view published announcements"
    ON public.announcements
    FOR SELECT
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND (status = 'published' OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin', 'pastor')
        ))
    );

CREATE POLICY "Admins and pastors can manage announcements"
    ON public.announcements
    FOR ALL
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin', 'pastor')
        )
    );

-- Children Ministry RLS (Strict Protection)
CREATE POLICY "Admins, pastors and children ministry leaders can manage children"
    ON public.children
    FOR ALL
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin', 'pastor', 'ministry_leader')
        )
    );

CREATE POLICY "Parents can view their own children"
    ON public.children
    FOR SELECT
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND parent_guardian_id IN (
            SELECT id FROM public.members WHERE user_id = auth.uid()
        )
    );

-- Youth Ministry RLS
CREATE POLICY "Admins, pastors and youth leaders can manage youth"
    ON public.youth_profiles
    FOR ALL
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin', 'pastor', 'ministry_leader')
        )
    );
