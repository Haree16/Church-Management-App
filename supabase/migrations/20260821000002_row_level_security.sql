-- ==============================================================================
-- Church Management System (CMS) - Phase 1 Row Level Security (RLS)
-- 20260821000002_row_level_security.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- HELPER SECURITY FUNCTIONS
-- ------------------------------------------------------------------------------

-- Check if current authenticated user is a platform super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all church IDs that the current user belongs to (with active status)
CREATE OR REPLACE FUNCTION public.get_user_church_ids()
RETURNS SETOF UUID AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN QUERY SELECT id FROM public.churches WHERE is_active = TRUE;
    ELSE
        RETURN QUERY
        SELECT church_id FROM public.church_members
        WHERE user_id = auth.uid() AND status = 'active';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has one of the specified roles in a given church
CREATE OR REPLACE FUNCTION public.has_church_role(target_church_id UUID, allowed_roles public.user_role[])
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.church_members
        WHERE church_id = target_church_id
          AND user_id = auth.uid()
          AND status = 'active'
          AND role = ANY(allowed_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is an active member of the church (any role)
CREATE OR REPLACE FUNCTION public.is_church_member(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.church_members
        WHERE church_id = target_church_id
          AND user_id = auth.uid()
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is church admin or pastor (top-level church leadership)
CREATE OR REPLACE FUNCTION public.is_church_admin_or_pastor(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_church_role(target_church_id, ARRAY['super_admin', 'pastor', 'church_admin']::public.user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is leadership (admin, pastor, ministry leader, group leader)
CREATE OR REPLACE FUNCTION public.is_church_leader(target_church_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_church_role(target_church_id, ARRAY['super_admin', 'pastor', 'church_admin', 'ministry_leader', 'group_leader']::public.user_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 1. CHURCHES RLS POLICIES
-- ------------------------------------------------------------------------------
-- Super admins can view all churches, regular users can view churches they belong to
CREATE POLICY "churches_select_policy" ON public.churches
    FOR SELECT
    USING (
        public.is_super_admin()
        OR id IN (SELECT public.get_user_church_ids())
    );

-- Only super admins and church admins can update church details
CREATE POLICY "churches_update_policy" ON public.churches
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.has_church_role(id, ARRAY['church_admin']::public.user_role[])
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.has_church_role(id, ARRAY['church_admin']::public.user_role[])
    );

-- Only super admin can insert or delete churches
CREATE POLICY "churches_insert_policy" ON public.churches
    FOR INSERT
    WITH CHECK (public.is_super_admin());

CREATE POLICY "churches_delete_policy" ON public.churches
    FOR DELETE
    USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 2. PROFILES RLS POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile, or profiles in the same church
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.church_members cm1
            JOIN public.church_members cm2 ON cm1.church_id = cm2.church_id
            WHERE cm1.user_id = auth.uid() AND cm2.user_id = public.profiles.id
        )
    );

-- Users can update their own profile; Super admins can update any profile
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    USING (id = auth.uid() OR public.is_super_admin())
    WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- Users can insert their own profile during registration/trigger
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT
    WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 3. CHURCH MEMBERS RLS POLICIES
-- ------------------------------------------------------------------------------
-- Members can view membership roster of their church; Pastors and Admins can view full details
CREATE POLICY "church_members_select_policy" ON public.church_members
    FOR SELECT
    USING (
        public.is_super_admin()
        OR user_id = auth.uid()
        OR public.is_church_member(church_id)
    );

-- Church admins and pastors can manage church memberships; Leaders can view
CREATE POLICY "church_members_insert_policy" ON public.church_members
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "church_members_update_policy" ON public.church_members
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "church_members_delete_policy" ON public.church_members
    FOR DELETE
    USING (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[])
    );

-- ------------------------------------------------------------------------------
-- 4. FAMILIES RLS POLICIES
-- ------------------------------------------------------------------------------
-- Members can view their own family or church staff can view all families in their church
CREATE POLICY "families_select_policy" ON public.families
    FOR SELECT
    USING (
        public.is_super_admin()
        OR (
            public.is_church_member(church_id)
            AND (
                public.is_church_leader(church_id)
                OR primary_contact_id = auth.uid()
                OR id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "families_insert_policy" ON public.families
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "families_update_policy" ON public.families
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR primary_contact_id = auth.uid()
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR primary_contact_id = auth.uid()
    );

CREATE POLICY "families_delete_policy" ON public.families
    FOR DELETE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- ------------------------------------------------------------------------------
-- 5. FAMILY MEMBERS RLS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "family_members_select_policy" ON public.family_members
    FOR SELECT
    USING (
        public.is_super_admin()
        OR (
            public.is_church_member(church_id)
            AND (
                public.is_church_leader(church_id)
                OR user_id = auth.uid()
                OR family_id IN (SELECT family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "family_members_insert_policy" ON public.family_members
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "family_members_update_policy" ON public.family_members
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "family_members_delete_policy" ON public.family_members
    FOR DELETE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- ------------------------------------------------------------------------------
-- 6. MINISTRIES RLS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone in the church can see active ministries
CREATE POLICY "ministries_select_policy" ON public.ministries
    FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

-- Admins, Pastors, or ministry leader can manage ministries
CREATE POLICY "ministries_insert_policy" ON public.ministries
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

CREATE POLICY "ministries_update_policy" ON public.ministries
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR (leader_id = auth.uid() AND public.is_church_member(church_id))
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR (leader_id = auth.uid() AND public.is_church_member(church_id))
    );

CREATE POLICY "ministries_delete_policy" ON public.ministries
    FOR DELETE
    USING (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[])
    );

-- ------------------------------------------------------------------------------
-- 7. GROUPS RLS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone in the church can view groups
CREATE POLICY "groups_select_policy" ON public.groups
    FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

-- Admins, Pastors, Ministry Leaders, or Group Leaders can manage groups
CREATE POLICY "groups_insert_policy" ON public.groups
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
    );

CREATE POLICY "groups_update_policy" ON public.groups
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR leader_id = auth.uid()
        OR co_leader_id = auth.uid()
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
        OR leader_id = auth.uid()
        OR co_leader_id = auth.uid()
    );

CREATE POLICY "groups_delete_policy" ON public.groups
    FOR DELETE
    USING (
        public.is_super_admin()
        OR public.is_church_admin_or_pastor(church_id)
    );

-- ------------------------------------------------------------------------------
-- 8. CHURCH SETTINGS RLS POLICIES
-- ------------------------------------------------------------------------------
-- Members can view general church settings and service timings
CREATE POLICY "church_settings_select_policy" ON public.church_settings
    FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );

-- Only Church Admins or Super Admins can update church settings
CREATE POLICY "church_settings_update_policy" ON public.church_settings
    FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin', 'pastor']::public.user_role[])
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin', 'pastor']::public.user_role[])
    );

CREATE POLICY "church_settings_insert_policy" ON public.church_settings
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[])
    );

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS RLS POLICIES
-- ------------------------------------------------------------------------------
-- Users can only view and modify their own notifications within their church
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_super_admin()
    );

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid() OR public.is_super_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_leader(church_id)
        OR user_id = auth.uid()
    );

CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE
    USING (user_id = auth.uid() OR public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 10. AUDIT LOGS RLS POLICIES
-- ------------------------------------------------------------------------------
-- Only Admins and Super Admins can view audit logs
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT
    USING (
        public.is_super_admin()
        OR public.has_church_role(church_id, ARRAY['church_admin']::public.user_role[])
    );

-- Any authenticated action can write to audit logs via trigger or system call
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.is_church_member(church_id)
    );
