-- ==============================================================================
-- PHASE 8: PRODUCTION READINESS - COMPOSITE INDEXES, AUDIT LOGS, & PERFORMANCE
-- ==============================================================================

-- 1. Optimized Composite Indexes for Multi-Tenant Query Speed
CREATE INDEX IF NOT EXISTS idx_members_church_status_created ON members(church_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_church_created ON visitors(church_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_church_date ON attendance_records(church_id, session_date);
CREATE INDEX IF NOT EXISTS idx_donations_church_date ON donations(church_id, donation_date);
CREATE INDEX IF NOT EXISTS idx_prayers_church_status ON prayer_requests(church_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_church_status ON follow_ups(church_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_children_church_class ON children(church_id, class_id);
CREATE INDEX IF NOT EXISTS idx_youth_church_group ON youth_profiles(church_id, group_id);
CREATE INDEX IF NOT EXISTS idx_announcements_church_status ON announcements(church_id, status, publish_date);

-- 2. Audit Logs Table (Enterprise Multi-Tenant Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'System',
    actor_role TEXT,
    action TEXT NOT NULL, -- e.g., 'member.created', 'donation.recorded', 'prayer.answered'
    resource_type TEXT NOT NULL, -- e.g., 'members', 'donations', 'prayer_requests'
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_church_created ON audit_logs(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- 3. RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs viewable by church admins and pastors"
    ON audit_logs FOR SELECT
    USING (
        church_id IN (
            SELECT church_id FROM church_members 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'church_admin', 'pastor')
        )
    );

CREATE POLICY "Audit logs insertable by active church users"
    ON audit_logs FOR INSERT
    WITH CHECK (
        church_id IN (
            SELECT church_id FROM church_members 
            WHERE user_id = auth.uid()
        )
    );
