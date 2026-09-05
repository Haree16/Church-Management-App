-- ==============================================================================
-- SHEPHERDHUB V2.0 PHASE 3: VISITOR MANAGEMENT & FOLLOW-UP MIGRATION
-- ==============================================================================

-- 1. ADD ADDITIONAL VISITOR COLUMNS TO PUBLIC.VISITORS
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone_call';
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT DEFAULT 'morning';
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS first_visit_date DATE;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS last_visit_date DATE;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 1;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS dob DATE;

-- Update existing records first_visit_date / last_visit_date
UPDATE public.visitors SET first_visit_date = visit_date WHERE first_visit_date IS NULL;
UPDATE public.visitors SET last_visit_date = visit_date WHERE last_visit_date IS NULL;

-- 2. VISITOR VISITS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.visitor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_attended TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    invited_by TEXT,
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_visitor_visits_church_visitor ON public.visitor_visits(church_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_visits_date ON public.visitor_visits(church_id, visit_date DESC);

-- Enable RLS
ALTER TABLE public.visitor_visits ENABLE ROW LEVEL SECURITY;

-- Policies for visitor_visits
CREATE POLICY "visitor_visits_select_policy" ON public.visitor_visits
    FOR SELECT USING (church_id IN (
        SELECT church_id FROM public.church_members WHERE user_id = auth.uid() AND status = 'active'
    ) OR is_super_admin());

CREATE POLICY "visitor_visits_insert_policy" ON public.visitor_visits
    FOR INSERT WITH CHECK (church_id IN (
        SELECT church_id FROM public.church_members WHERE user_id = auth.uid() AND status = 'active'
    ) OR is_super_admin());

CREATE POLICY "visitor_visits_update_policy" ON public.visitor_visits
    FOR UPDATE USING (church_id IN (
        SELECT church_id FROM public.church_members WHERE user_id = auth.uid() AND status = 'active'
    ) OR is_super_admin());

CREATE POLICY "visitor_visits_delete_policy" ON public.visitor_visits
    FOR DELETE USING (church_id IN (
        SELECT church_id FROM public.church_members WHERE user_id = auth.uid() AND status = 'active'
    ) OR is_super_admin());
