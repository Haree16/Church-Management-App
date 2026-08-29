-- ==============================================================================
-- Church Management System (CMS) - Phase 1 Safe Seed Data
-- 20260821000003_seed_data.sql
-- ==============================================================================

-- 1. Create Demo Church
INSERT INTO public.churches (
    id,
    name,
    slug,
    tagline,
    logo_url,
    email,
    phone,
    website,
    address,
    city,
    state,
    postal_code,
    country,
    timezone,
    currency,
    is_active
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Grace City Church',
    'grace-city-chennai',
    'Loving God, Loving People, Serving Chennai',
    'https://images.unsplash.com/photo-1548625361-195fe578b9ec?w=200&auto=format&fit=crop&q=80',
    'office@gracecitychennai.org',
    '+91 44 2836 1234',
    'https://gracecitychennai.org',
    'No. 12, Mount Road, Anna Salai',
    'Chennai',
    'Tamil Nadu',
    '600002',
    'India',
    'Asia/Kolkata',
    'INR',
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- Optional Second Church for Multi-Tenant verification
INSERT INTO public.churches (
    id,
    name,
    slug,
    tagline,
    logo_url,
    email,
    phone,
    website,
    address,
    city,
    state,
    postal_code,
    country,
    timezone,
    currency,
    is_active
) VALUES (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'Bethel Fellowship Chennai',
    'bethel-chennai',
    'House of God in the Heart of Chennai',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
    'contact@bethelchennai.org',
    '+91 44 2491 5678',
    'https://bethelchennai.org',
    '45, 100 Feet Road, Velachery',
    'Chennai',
    'Tamil Nadu',
    '600042',
    'India',
    'Asia/Kolkata',
    'INR',
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 2. Create Profiles for Demo Users
-- Fixed Demo UUIDs for predictable testing and seeding
-- Note: In real Supabase, these correspond to auth.users IDs.
-- When creating users via auth.signUp or Supabase dashboard, handle_new_user trigger automatically inserts or updates profiles.

INSERT INTO public.profiles (id, email, first_name, last_name, display_name, phone, avatar_url, is_super_admin)
VALUES 
    (
        'u0000000-0000-0000-0000-000000000001'::uuid,
        'superadmin@churchcms.io',
        'Alexander',
        'Wright',
        'Alex Wright',
        '+1 (555) 100-0001',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        TRUE
    ),
    (
        'u0000000-0000-0000-0000-000000000002'::uuid,
        'pastor@gracevalley.org',
        'David',
        'Sterling',
        'Pastor David Sterling',
        '+1 (555) 200-0002',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        FALSE
    ),
    (
        'u0000000-0000-0000-0000-000000000003'::uuid,
        'admin@gracevalley.org',
        'Rachel',
        'Adams',
        'Rachel Adams',
        '+1 (555) 300-0003',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        FALSE
    ),
    (
        'u0000000-0000-0000-0000-000000000004'::uuid,
        'worship@gracevalley.org',
        'Marcus',
        'Chen',
        'Marcus Chen',
        '+1 (555) 400-0004',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        FALSE
    ),
    (
        'u0000000-0000-0000-0000-000000000005'::uuid,
        'groups@gracevalley.org',
        'Elena',
        'Reyes',
        'Elena Reyes',
        '+1 (555) 500-0005',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        FALSE
    ),
    (
        'u0000000-0000-0000-0000-000000000006'::uuid,
        'volunteer@gracevalley.org',
        'James',
        'Wilson',
        'James Wilson',
        '+1 (555) 600-0006',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        FALSE
    ),
    (
        'u0000000-0000-0000-0000-000000000007'::uuid,
        'member@gracevalley.org',
        'Sarah',
        'Jenkins',
        'Sarah Jenkins',
        '+1 (555) 700-0007',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        FALSE
    )
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    is_super_admin = EXCLUDED.is_super_admin;

-- 3. Link Users to Church with Roles in church_members
INSERT INTO public.church_members (church_id, user_id, role, status, membership_number, membership_date, title)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000001'::uuid,
        'super_admin',
        'active',
        'GV-0001',
        '2022-01-01',
        'Platform Administrator'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000002'::uuid,
        'pastor',
        'active',
        'GV-0002',
        '2022-01-15',
        'Senior Pastor'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000003'::uuid,
        'church_admin',
        'active',
        'GV-0003',
        '2022-02-01',
        'Executive Church Administrator'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000004'::uuid,
        'ministry_leader',
        'active',
        'GV-0004',
        '2022-03-10',
        'Worship & Creative Arts Director'
    ),
    (
        'a0000000-0000-0000-0000-000000000005'::uuid,
        'u0000000-0000-0000-0000-000000000005'::uuid,
        'group_leader',
        'active',
        'GV-0005',
        '2022-04-05',
        'Community Small Groups Leader'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000006'::uuid,
        'volunteer',
        'active',
        'GV-0006',
        '2023-01-12',
        'Welcome & Hospitality Team'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000007'::uuid,
        'member',
        'active',
        'GV-0007',
        '2023-05-20',
        'Active Covenant Member'
    )
ON CONFLICT (church_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    title = EXCLUDED.title;

-- 4. Church Settings for Grace Valley
INSERT INTO public.church_settings (
    church_id,
    service_timings,
    general_settings,
    feature_flags,
    branding
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '[
        {"id": "st-1", "name": "Sunday Traditional Service", "day": "Sunday", "time": "09:00 AM", "type": "In-Person & Streamed"},
        {"id": "st-2", "name": "Sunday Contemporary Service", "day": "Sunday", "time": "11:15 AM", "type": "In-Person & Streamed"},
        {"id": "st-3", "name": "Wednesday Deep Dive & Youth", "day": "Wednesday", "time": "07:00 PM", "type": "In-Person"}
    ]'::jsonb,
    '{
        "date_format": "MM/DD/YYYY",
        "time_format": "12h",
        "fiscal_year_start": "01-01",
        "require_family_head": true,
        "allow_public_giving": true
    }'::jsonb,
    '{
        "online_giving": true,
        "attendance_tracking": true,
        "prayer_requests": true,
        "volunteer_scheduling": true,
        "check_in_kiosk": true,
        "sms_notifications": true
    }'::jsonb,
    '{
        "primary_color": "#0284c7",
        "secondary_color": "#0369a1",
        "accent_color": "#10b981"
    }'::jsonb
) ON CONFLICT (church_id) DO UPDATE SET
    service_timings = EXCLUDED.service_timings;

-- 5. Demo Ministries
INSERT INTO public.ministries (id, church_id, name, description, leader_id, color, icon)
VALUES
    (
        'm0000000-0000-0000-0000-000000000001'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Worship & Creative Arts',
        'Leading the congregation in vibrant, Christ-centered worship and media production.',
        'u0000000-0000-0000-0000-000000000004'::uuid,
        '#6366f1',
        'Music'
    ),
    (
        'm0000000-0000-0000-0000-000000000002'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'NextGen Youth & Children',
        'Discipling students and young families from nursery through high school.',
        'u0000000-0000-0000-0000-000000000005'::uuid,
        '#ec4899',
        'Heart'
    ),
    (
        'm0000000-0000-0000-0000-000000000003'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'Community Outreach & Missions',
        'Serving local food pantries, global missions partners, and city relief programs.',
        'u0000000-0000-0000-0000-000000000002'::uuid,
        '#10b981',
        'Globe'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Groups
INSERT INTO public.groups (id, church_id, ministry_id, name, description, leader_id, meeting_day, meeting_time, frequency, location, capacity)
VALUES
    (
        'g0000000-0000-0000-0000-000000000001'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'm0000000-0000-0000-0000-000000000002'::uuid,
        'North Austin Young Adults',
        'Weekly fellowship, Bible study, and dinner for 20s and 30s.',
        'u0000000-0000-0000-0000-000000000005'::uuid,
        'Tuesday',
        '07:00 PM',
        'weekly',
        'Elena & David''s Home',
        20
    ),
    (
        'g0000000-0000-0000-0000-000000000002'::uuid,
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'm0000000-0000-0000-0000-000000000001'::uuid,
        'Vocalists & Instrumentals Rehearsal',
        'Weekly prep and prayer for weekend worship sets.',
        'u0000000-0000-0000-0000-000000000004'::uuid,
        'Thursday',
        '06:30 PM',
        'weekly',
        'Main Sanctuary Stage',
        25
    )
ON CONFLICT (id) DO NOTHING;

-- 7. Demo Family
INSERT INTO public.families (id, church_id, family_name, primary_contact_id, address, city, state, postal_code, phone)
VALUES (
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Jenkins Family',
    'u0000000-0000-0000-0000-000000000007'::uuid,
    '4502 Evergreen Terrace',
    'Austin',
    'TX',
    '78704',
    '+1 (555) 700-0007'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.family_members (family_id, church_id, user_id, relationship, is_emergency_contact)
VALUES (
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'u0000000-0000-0000-0000-000000000007'::uuid,
    'head',
    TRUE
) ON CONFLICT (family_id, user_id) DO NOTHING;

-- 8. Demo Notifications
INSERT INTO public.notifications (church_id, user_id, title, message, type, is_read, link)
VALUES
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000003'::uuid,
        'New Member Application',
        'Sarah Jenkins submitted her covenant membership confirmation.',
        'info',
        FALSE,
        '/people/members'
    ),
    (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        'u0000000-0000-0000-0000-000000000003'::uuid,
        'Service Times Updated',
        'Updated Sunday Service schedule published to public portal.',
        'success',
        TRUE,
        '/settings/church'
    );

-- 9. Demo Audit Log
INSERT INTO public.audit_logs (church_id, user_id, action, resource_type, resource_id, details, ip_address)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'u0000000-0000-0000-0000-000000000003'::uuid,
    'UPDATE_SETTINGS',
    'church_settings',
    'a0000000-0000-0000-0000-000000000001',
    '{"updated_by": "admin@gracevalley.org", "changes": ["service_timings"]}'::jsonb,
    '127.0.0.1'
);
