-- ==============================================================================
-- Church Management System (CMS) - Phase 1 Schema Migration
-- 20260821000001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for Role Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'pastor',
        'church_admin',
        'ministry_leader',
        'group_leader',
        'volunteer',
        'member'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for Member Status
DO $$ BEGIN
    CREATE TYPE member_status AS ENUM (
        'active',
        'inactive',
        'pending',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for Family Relationship
DO $$ BEGIN
    CREATE TYPE family_relationship AS ENUM (
        'head',
        'spouse',
        'child',
        'parent',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for Notification Types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'info',
        'success',
        'warning',
        'error',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Helper function: Updated_at automatic timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. CHURCHES TABLE (Multi-Tenant Root)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.churches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    logo_url TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    currency TEXT DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churches_slug ON public.churches(slug);
CREATE INDEX IF NOT EXISTS idx_churches_active ON public.churches(is_active);

CREATE TRIGGER trigger_churches_updated_at
    BEFORE UPDATE ON public.churches
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 2. PROFILES TABLE (Supabase Auth User Extensions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Trigger to automatically create profile when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. CHURCH MEMBERS TABLE (User <-> Church with Role & Status)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.church_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    status member_status NOT NULL DEFAULT 'active',
    membership_number TEXT,
    membership_date DATE DEFAULT CURRENT_DATE,
    title TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_church_user UNIQUE (church_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_church_members_church_id ON public.church_members(church_id);
CREATE INDEX IF NOT EXISTS idx_church_members_user_id ON public.church_members(user_id);
CREATE INDEX IF NOT EXISTS idx_church_members_role ON public.church_members(church_id, role);
CREATE INDEX IF NOT EXISTS idx_church_members_status ON public.church_members(church_id, status);

CREATE TRIGGER trigger_church_members_updated_at
    BEFORE UPDATE ON public.church_members
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 4. FAMILIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    family_name TEXT NOT NULL,
    primary_contact_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_church_id ON public.families(church_id);
CREATE INDEX IF NOT EXISTS idx_families_primary_contact ON public.families(primary_contact_id);

CREATE TRIGGER trigger_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 5. FAMILY MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship family_relationship NOT NULL DEFAULT 'other',
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_family_user UNIQUE (family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_family_members_church_id ON public.family_members(church_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);

CREATE TRIGGER trigger_family_members_updated_at
    BEFORE UPDATE ON public.family_members
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 6. MINISTRIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ministries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#2563eb',
    icon TEXT DEFAULT 'Users',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ministries_church_id ON public.ministries(church_id);
CREATE INDEX IF NOT EXISTS idx_ministries_leader_id ON public.ministries(leader_id);

CREATE TRIGGER trigger_ministries_updated_at
    BEFORE UPDATE ON public.ministries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 7. GROUPS TABLE (Small groups, Life groups, Cell groups)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    co_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    meeting_day TEXT, -- e.g. 'Wednesday', 'Sunday'
    meeting_time TEXT, -- e.g. '19:00'
    frequency TEXT DEFAULT 'weekly', -- 'weekly', 'biweekly', 'monthly'
    location TEXT,
    address TEXT,
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_church_id ON public.groups(church_id);
CREATE INDEX IF NOT EXISTS idx_groups_ministry_id ON public.groups(ministry_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader_id ON public.groups(leader_id);

CREATE TRIGGER trigger_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 8. CHURCH SETTINGS TABLE (1:1 with Churches)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.church_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE UNIQUE,
    service_timings JSONB NOT NULL DEFAULT '[
        {"id": "st-1", "name": "Sunday Morning Service", "day": "Sunday", "time": "09:00 AM", "type": "In-Person & Online"},
        {"id": "st-2", "name": "Sunday Midday Service", "day": "Sunday", "time": "11:30 AM", "type": "In-Person"},
        {"id": "st-3", "name": "Midweek Prayer & Worship", "day": "Wednesday", "time": "07:00 PM", "type": "Online"}
    ]'::jsonb,
    general_settings JSONB NOT NULL DEFAULT '{
        "date_format": "MM/DD/YYYY",
        "time_format": "12h",
        "fiscal_year_start": "01-01",
        "require_family_head": true,
        "allow_public_giving": true
    }'::jsonb,
    feature_flags JSONB NOT NULL DEFAULT '{
        "online_giving": true,
        "attendance_tracking": true,
        "prayer_requests": true,
        "volunteer_scheduling": true,
        "check_in_kiosk": true,
        "sms_notifications": false
    }'::jsonb,
    branding JSONB NOT NULL DEFAULT '{
        "primary_color": "#0284c7",
        "secondary_color": "#0369a1",
        "accent_color": "#10b981",
        "banner_url": null
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_church_settings_church_id ON public.church_settings(church_id);

CREATE TRIGGER trigger_church_settings_updated_at
    BEFORE UPDATE ON public.church_settings
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 9. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_church ON public.notifications(church_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ==============================================================================
-- 10. AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_church_id ON public.audit_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(church_id, action);
