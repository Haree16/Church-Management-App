# Church Management System (CMS) — Phase 1 & 2

A production-ready multi-church management platform built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui components, PostgreSQL, and Supabase.

---

## 🏛️ Architecture & Modules Overview

### 1. Multi-Church Architecture & Tenancy
* **Multi-Tenant Database Design:** Every church-owned record is partitioned by a `church_id` foreign key.
* **Tenant Isolation:** Cross-church access is strictly prevented at both the database level (via PostgreSQL Row Level Security) and application state level (via `AuthContext` and tenant switching).
* **Multi-Church Switcher:** Users with access to multiple church campuses can seamlessly switch active tenant context.

---

### 2. People Management Module (Phase 2)

#### A. Members Management (`/people/members`)
* **Complete Member Profile Fields:**
  * Member ID (`membership_number`)
  * First & Last Name, Display Name, Avatar URL
  * Gender (`male`, `female`, `other`)
  * Date of Birth (`dob`), Age calculation
  * Phone, Email, Physical Address, City, State, Postal Code
  * Marital Status (`single`, `married`, `widowed`, `divorced`, `separated`), Marriage Date
  * Occupation, Emergency Contact Name & Phone
  * Spiritual Milestones: Church Joining Date, Water Baptism Date, Salvation Date, Previous Church
  * Assignments: Family Household, Ministry Department, Small Group / Circle
  * Membership Status: `active`, `inactive`, `transferred`, `moved_away`, `archived`
  * Pastoral & Administrative Notes
* **Interactive Member Directory:**
  * Multi-field search (Name, Email, Phone, Member ID, Occupation, Previous Church)
  * Filters (Status, Gender, Ministry, Small Group, Family)
  * Sorting (Name A-Z/Z-A, Joined Date, Status, Member ID)
  * Pagination (configurable page size & responsive controls)
  * Add Member modal dialog with multi-tab validation
  * Edit Member modal dialog
  * Archive Member with confirmation modal
  * Delete Member with confirmation modal
  * **Export CSV:** One-click instant download of filtered member records.

#### B. Professional Member Profile (`/people/members/:id`)
* **Header Summary:** Avatar, status badge, role badge, member ID, occupation, contact tags.
* **Top Metric Cards:** Total recorded attendance count, YTD giving total, assigned ministry, small group.
* **10 Dedicated Information Tabs:**
  1. **Overview:** Personal details, address, spiritual milestones, emergency contact.
  2. **Family:** Household links, family relationship, shared address.
  3. **Attendance:** Historical check-in log, service timings, in-person/online tags.
  4. **Ministries:** Assigned ministry departments, leaders, and color indicators.
  5. **Groups:** Life group assignments, meeting schedule, and location.
  6. **Events:** Registered church conferences, retreats, baptisms.
  7. **Giving:** Donation transactions, tax receipts, and fund allocations.
  8. **Prayer Requests:** Submitted requests, praise reports, and prayer counts.
  9. **Follow-ups:** Assigned pastoral care follow-up tickets and outcomes.
  10. **Notes:** Staff counseling notes and timestamped notes logger.

#### C. Family Households (`/people/families`)
* **Features:**
  * Create & Edit family household records
  * Designate Head of Household / Primary Contact
  * Household phone, shared residential address
  * Visual Family Tree & relationship badges (Head, Spouse, Children, Parent, Other).

#### D. Sunday Visitors & Guest Integration (`/people/visitors`)
* **Visitor Fields:** Guest Name, Phone, Email, Address, Visit Date, Service Attended, Invited By, How Heard, Family Size, Prayer Request, Staff Notes, Follow-up Status (`new`, `contacted`, `follow_up_required`, `connected`, `became_member`, `not_interested`), Assigned Pastoral Leader.
* **Automated Workflow:**
  1. Record connection card details.
  2. Automatically generate follow-up task for assigned pastor/leader when follow-up is required.
  3. Real-time KPI statistics in Dashboard and Visitor header.
  4. **1-Click Conversion to Covenant Member:** Creates profile and church_member record, assigns ministry/group, updates status to `became_member`, and preserves full guest audit history!

---

### 3. Database Schema (PostgreSQL + Supabase)

Master migrations located in [`supabase/migrations/`](file:///home/haldev08/APP%20BUILD/CMS/supabase/migrations/):
* `20260821000001_initial_schema.sql` (Core tables)
* `20260821000002_row_level_security.sql` (Security & RLS)
* `20260821000003_seed_data.sql` (Seed data)
* `20260821000004_people_module.sql` (Phase 2 People, Visitors, Follow-ups, Attendance, Donations, Prayer Requests)

| Table | Description | Primary Key |
| :--- | :--- | :--- |
| `churches` | Root tenant entity | UUID |
| `profiles` | Extended user profiles with DOB, gender, marital status, emergency contact | UUID |
| `church_members` | Membership records with spiritual milestones & department foreign keys | UUID |
| `families` | Household units with primary contact FK | UUID |
| `family_members` | Relationship mapping within households | UUID |
| `visitors` | Sunday guest connection cards with conversion status | UUID |
| `follow_ups` | Pastoral and visitor follow-up tickets | UUID |
| `attendance_records`| Check-ins and service attendance | UUID |
| `donations` | Financial gifts, tithes, and designated funds | UUID |
| `prayer_requests` | Congregational prayers and praise reports | UUID |
| `ministries` | Church departments & leadership | UUID |
| `groups` | Small groups / life groups | UUID |
| `church_settings` | Service timings JSONB, feature flags, branding | UUID |
| `notifications` | In-app user notifications | UUID |
| `audit_logs` | Administrative audit trail | UUID |

---

### 4. 7-Tier Role & Permission Matrix

* **Super Admin (`super_admin`):** Global multi-church platform oversight & database management.
* **Pastor (`pastor`):** Pastoral oversight, counseling care notes, member records, prayer wall.
* **Church Admin (`church_admin`):** Complete church operational administration, settings, finances, rosters.
* **Ministry Leader (`ministry_leader`):** Department oversight (Worship, Youth, Outreach), event coordination.
* **Group Leader (`group_leader`):** Small group roster management, attendance logging.
* **Volunteer (`volunteer`):** Service schedules, welcome crew, check-in operations.
* **Member (`member`):** Personal giving history, family profile, prayer requests, public announcements.

---

## 🚀 Running the Project

```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your web browser.
