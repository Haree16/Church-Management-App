-- ==============================================================================
-- Church Management System (CMS) - Master Database Schema & Migrations
-- Phase 1: Foundation, Security, Multi-Tenancy & Roles
-- ==============================================================================
--
-- Tables:
-- 1. churches (Multi-tenant root, indexed by id & slug)
-- 2. profiles (Extends auth.users with display_name, phone, super_admin)
-- 3. church_members (Role-based membership linking profiles to churches)
-- 4. families (Household entity owned by church_id)
-- 5. family_members (Relationships: head, spouse, child, parent, other)
-- 6. ministries (Church ministry departments with leader & color tag)
-- 7. groups (Small groups / Life groups linked to ministry & church)
-- 8. church_settings (Service times JSONB, feature flags, branding)
-- 9. notifications (User & church notifications with read status)
-- 10. audit_logs (Security audit trail with actor, action, payload)
--
-- Roles:
-- super_admin | pastor | church_admin | ministry_leader | group_leader | volunteer | member
--
-- ==============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
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
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE family_relationship AS ENUM ('head', 'spouse', 'child', 'parent', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Updated_at Trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Churches
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
    country TEXT DEFAULT 'US',
    timezone TEXT DEFAULT 'America/New_York',
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_churches_slug ON public.churches(slug);
CREATE TRIGGER trigger_churches_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Profiles
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
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Handle new user creation trigger
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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Church Members
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
CREATE TRIGGER trigger_church_members_updated_at BEFORE UPDATE ON public.church_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Families
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
CREATE TRIGGER trigger_families_updated_at BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Family Members
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
CREATE TRIGGER trigger_family_members_updated_at BEFORE UPDATE ON public.family_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Ministries
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
CREATE TRIGGER trigger_ministries_updated_at BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    co_leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    meeting_day TEXT,
    meeting_time TEXT,
    frequency TEXT DEFAULT 'weekly',
    location TEXT,
    address TEXT,
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_groups_church_id ON public.groups(church_id);
CREATE TRIGGER trigger_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. Church Settings
CREATE TABLE IF NOT EXISTS public.church_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE UNIQUE,
    service_timings JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    branding JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_church_settings_church_id ON public.church_settings(church_id);
CREATE TRIGGER trigger_church_settings_updated_at BEFORE UPDATE ON public.church_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9. Notifications
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

-- 10. Audit Logs
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

-- ------------------------------------------------------------------------------
-- RLS POLICIES & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_church_ids()
RETURNS SETOF UUID AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN QUERY SELECT id FROM public.churches WHERE is_active = TRUE;
    ELSE
        RETURN QUERY SELECT church_id FROM public.church_members WHERE user_id = auth.uid() AND status = 'active';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_church_role(target_church_id UUID, allowed_roles public.user_role[])
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN RETURN TRUE; END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.church_members
        WHERE church_id = target_church_id AND user_id = auth.uid() AND status = 'active' AND role = ANY(allowed_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_church_member(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN RETURN TRUE; END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.church_members WHERE church_id = target_church_id AND user_id = auth.uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_church_admin_or_pastor(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_church_role(target_church_id, ARRAY['super_admin', 'pastor', 'church_admin']::public.user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_church_leader(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_church_role(target_church_id, ARRAY['super_admin', 'pastor', 'church_admin', 'ministry_leader', 'group_leader']::public.user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Churches policies
CREATE POLICY "churches_select" ON public.churches FOR SELECT USING (public.is_super_admin() OR id IN (SELECT public.get_user_church_ids()));
CREATE POLICY "churches_update" ON public.churches FOR UPDATE USING (public.is_super_admin() OR public.has_church_role(id, ARRAY['church_admin']::public.user_role[]));
CREATE POLICY "churches_insert" ON public.churches FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY "churches_delete" ON public.churches FOR DELETE USING (public.is_super_admin());

-- Profiles policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.church_members cm1 JOIN public.church_members cm2 ON cm1.church_id = cm2.church_id WHERE cm1.user_id = auth.uid() AND cm2.user_id = public.profiles.id
));
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- Church members policies
CREATE POLICY "church_members_select" ON public.church_members FOR SELECT USING (public.is_super_admin() OR user_id = auth.uid() OR public.is_church_member(church_id));
CREATE POLICY "church_members_insert" ON public.church_members FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "church_members_update" ON public.church_members FOR UPDATE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "church_members_delete" ON public.church_members FOR DELETE USING (public.is_super_admin() OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[]));

-- Families policies
CREATE POLICY "families_select" ON public.families FOR SELECT USING (public.is_super_admin() OR (public.is_church_member(church_id) AND (public.is_church_leader(church_id) OR primary_contact_id = auth.uid() OR id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()))));
CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "families_update" ON public.families FOR UPDATE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id) OR primary_contact_id = auth.uid());
CREATE POLICY "families_delete" ON public.families FOR DELETE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));

-- Family members policies
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT USING (public.is_super_admin() OR (public.is_church_member(church_id) AND (public.is_church_leader(church_id) OR user_id = auth.uid() OR family_id IN (SELECT family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()))));
CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));

-- Ministries policies
CREATE POLICY "ministries_select" ON public.ministries FOR SELECT USING (public.is_super_admin() OR public.is_church_member(church_id));
CREATE POLICY "ministries_insert" ON public.ministries FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));
CREATE POLICY "ministries_update" ON public.ministries FOR UPDATE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id) OR (leader_id = auth.uid() AND public.is_church_member(church_id)));
CREATE POLICY "ministries_delete" ON public.ministries FOR DELETE USING (public.is_super_admin() OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[]));

-- Groups policies
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (public.is_super_admin() OR public.is_church_member(church_id));
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_leader(church_id));
CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id) OR leader_id = auth.uid() OR co_leader_id = auth.uid());
CREATE POLICY "groups_delete" ON public.groups FOR DELETE USING (public.is_super_admin() OR public.is_church_admin_or_pastor(church_id));

-- Church settings policies
CREATE POLICY "church_settings_select" ON public.church_settings FOR SELECT USING (public.is_super_admin() OR public.is_church_member(church_id));
CREATE POLICY "church_settings_update" ON public.church_settings FOR UPDATE USING (public.is_super_admin() OR public.has_church_role(church_id, ARRAY['church_admin', 'pastor']::public.user_role[]));
CREATE POLICY "church_settings_insert" ON public.church_settings FOR INSERT WITH CHECK (public.is_super_admin() OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[]));

-- Notifications policies
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_leader(church_id) OR user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (user_id = auth.uid() OR public.is_super_admin());

-- Audit logs policies
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (public.is_super_admin() OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[]));
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (public.is_super_admin() OR public.is_church_member(church_id));
