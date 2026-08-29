-- =============================================================================
-- Phase 4: Attendance & Event Management Module
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Events Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id             UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  event_type            TEXT NOT NULL DEFAULT 'Sunday Service' CHECK (event_type IN (
                          'Sunday Service','Conference','Prayer Meeting','Bible Study',
                          'Youth Event','Children''s Event','Outreach','Retreat','Meeting','Other'
                        )),
  start_date            TIMESTAMPTZ NOT NULL,
  end_date              TIMESTAMPTZ NOT NULL,
  location              TEXT NOT NULL DEFAULT '',
  address               TEXT,
  organizer_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ministry_id           UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  group_id              UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  capacity              INTEGER,
  registration_required BOOLEAN NOT NULL DEFAULT false,
  registration_deadline TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft','cancelled','completed')),
  banner_url            TEXT,
  qr_code_identifier    TEXT NOT NULL DEFAULT 'QR-' || substring(gen_random_uuid()::text, 1, 12),
  is_featured           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_church_id   ON public.events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date  ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type  ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_ministry_id ON public.events(ministry_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Event Registrations Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  event_id         UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  member_id        UUID REFERENCES public.church_members(id) ON DELETE SET NULL,
  visitor_id       UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  attendee_name    TEXT NOT NULL,
  attendee_email   TEXT,
  attendee_phone   TEXT,
  ticket_count     INTEGER NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','waitlist','cancelled','checked_in')),
  notes            TEXT,
  registered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_registrations_church_id ON public.event_registrations(church_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id  ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_member_id ON public.event_registrations(member_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Attendance Records Table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id           UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  member_id           UUID REFERENCES public.church_members(id) ON DELETE SET NULL,
  visitor_id          UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  event_id            UUID REFERENCES public.events(id) ON DELETE SET NULL,
  group_id            UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  ministry_id         UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  service_timing_id   TEXT,
  session_type        TEXT NOT NULL DEFAULT 'Sunday Service' CHECK (session_type IN (
                        'Sunday Service','Bible Study','Prayer Meeting','Youth Meeting',
                        'Children''s Meeting','Small Groups','Special Events','Wednesday Midweek'
                      )),
  service_name        TEXT NOT NULL,
  service_date        DATE NOT NULL,
  check_in_time       TEXT,
  check_in_type       TEXT NOT NULL DEFAULT 'in_person' CHECK (check_in_type IN (
                        'in_person','qr_scan','kiosk','manual_roster'
                      )),
  status              TEXT NOT NULL DEFAULT 'present' CHECK (status IN (
                        'present','absent','excused','first_time_visitor'
                      )),
  temperature_tag     TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT attendance_has_attendee CHECK (member_id IS NOT NULL OR visitor_id IS NOT NULL)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attendance_church_id        ON public.attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id        ON public.attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_service_date     ON public.attendance(service_date);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id         ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_group_id         ON public.attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_type     ON public.attendance(session_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Triggers (auto-update updated_at)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_events_updated_at ON public.events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS set_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER set_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- EVENTS: Any authenticated user in the same church can read published events
CREATE POLICY "events_church_read"
  ON public.events FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
    )
    OR church_id IN (
      SELECT church_id FROM public.church_admins
      WHERE user_id = auth.uid()
    )
  );

-- EVENTS: Admins, pastors, ministry leaders can create
CREATE POLICY "events_staff_write"
  ON public.events FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor','ministry_leader')
    )
  );

-- EVENTS: Staff can update
CREATE POLICY "events_staff_update"
  ON public.events FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor','ministry_leader')
    )
  );

-- EVENTS: Admin/pastor can delete
CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor')
    )
  );

-- EVENT REGISTRATIONS: Church members can read registrations for their church
CREATE POLICY "event_registrations_church_read"
  ON public.event_registrations FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members WHERE user_id = auth.uid()
    )
  );

-- EVENT REGISTRATIONS: Authenticated users can register themselves
CREATE POLICY "event_registrations_self_insert"
  ON public.event_registrations FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM public.church_members WHERE user_id = auth.uid()
    )
  );

-- EVENT REGISTRATIONS: Staff can update any registration
CREATE POLICY "event_registrations_staff_update"
  ON public.event_registrations FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor','ministry_leader','group_leader')
    )
  );

-- ATTENDANCE: Staff can read attendance
CREATE POLICY "attendance_staff_read"
  ON public.attendance FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
    )
  );

-- ATTENDANCE: Staff with attendance:record can insert
CREATE POLICY "attendance_staff_write"
  ON public.attendance FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor','ministry_leader','group_leader')
    )
  );

-- ATTENDANCE: Staff can delete (for undo functionality)
CREATE POLICY "attendance_staff_delete"
  ON public.attendance FOR DELETE
  USING (
    church_id IN (
      SELECT church_id FROM public.church_members
      WHERE user_id = auth.uid()
      AND role IN ('super_admin','church_admin','pastor','ministry_leader','group_leader')
    )
  );
