-- ==============================================================================
-- Migration: 20260821000008_church_giving_and_finance_module.sql
-- Description: Phase 6 Church Giving, Funds, Donations, Audit Logs & Giving Statements
-- ==============================================================================

-- 1. Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash',
        'bank_transfer',
        'cheque',
        'card',
        'online',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM (
        'completed',
        'pending',
        'failed',
        'refunded',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE finance_entity_type AS ENUM (
        'donation',
        'fund'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE finance_action_type AS ENUM (
        'created',
        'updated',
        'archived',
        'deleted',
        'restored'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. DONATION FUNDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donation_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    target_amount NUMERIC(12, 2),
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
    color TEXT DEFAULT '#0284c7',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_fund_code_per_church UNIQUE (church_id, code)
);

CREATE INDEX IF NOT EXISTS idx_donation_funds_church ON public.donation_funds(church_id, is_active);
CREATE INDEX IF NOT EXISTS idx_donation_funds_code ON public.donation_funds(church_id, code);

CREATE TRIGGER trigger_donation_funds_updated_at
    BEFORE UPDATE ON public.donation_funds
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 3. DONATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    fund_id UUID REFERENCES public.donation_funds(id) ON DELETE RESTRICT,
    donor_name TEXT NOT NULL,
    donor_email TEXT,
    donor_phone TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    fund_name TEXT NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    reference_number TEXT,
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status donation_status NOT NULL DEFAULT 'completed',
    is_tax_deductible BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_church_date ON public.donations(church_id, donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_member_id ON public.donations(member_id);
CREATE INDEX IF NOT EXISTS idx_donations_fund_id ON public.donations(fund_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(church_id, status);
CREATE INDEX IF NOT EXISTS idx_donations_method ON public.donations(church_id, payment_method);

CREATE TRIGGER trigger_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 4. FINANCE AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    entity_type finance_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action finance_action_type NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    previous_value JSONB,
    new_value JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_church ON public.finance_audit_logs(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_audit_entity ON public.finance_audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE public.donation_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Donation Funds RLS
CREATE POLICY "Church admins & super admins can manage donation funds"
    ON public.donation_funds
    FOR ALL
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin')
            )
        )
    );

CREATE POLICY "Authenticated users can view active donation funds in their church"
    ON public.donation_funds
    FOR SELECT
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND is_active = TRUE
    );

-- Donations RLS
CREATE POLICY "Admins & Finance managers have full access to donations"
    ON public.donations
    FOR ALL
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin')
            )
        )
    );

CREATE POLICY "Members can only view their own giving records"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND (
            member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
            OR recorded_by = auth.uid()
        )
    );

-- Finance Audit Logs RLS (Read-only for admins, insert-only for operations)
CREATE POLICY "Admins can view finance audit logs"
    ON public.finance_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
        AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('super_admin', 'church_admin')
            )
        )
    );

CREATE POLICY "System and authorized users can log finance audit events"
    ON public.finance_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())
    );
