# SHIFT ATLM Management Application

A digital platform designed for managing staff shift schedules and automating the serah terima jaga (handover) process for Ahli Teknologi Laboratorium Medik (ATLM) at RSUD Sultan Muhammad Jamaludin I.

## User Review & Critical Decisions

> [!IMPORTANT]
> The database and authentication will be implemented using **Supabase** (manual integration). Please have your Supabase URL and Anon Key ready for the implementation phase.

- **Confirmed Decision 1**: Mobile-first application with a clinical, professional aesthetic.
- **Confirmed Decision 2**: Strict Row Level Security (RLS) enforcement at the database level.
- **Confirmed Decision 3**: Navigation based on a mobile-first bottom-bar approach and desktop sidebar.

## 1. Overview & Core Concept

- **What It Does**: Digitizes laboratory shift management, provides structured handover forms, and tracks pending tasks/equipment issues.
- **Target Audience**: ATLM staff and Administrators at RSUD Sultan Muhammad Jamaludin I.
- **Key Value**: Improved accountability, efficient handover workflow, and structured historical data.

## 2. User Experience & Visual Design

- **Aesthetic Direction**: Clinical/Professional (precision and clarity).
- **Color Palette**: Navy blue (primary), White/Light Gray (background), Teal (accent), Red (alerts/critical status).
- **Typography**: Clean sans-serif (e.g., Inter) for interface, tabular monospace for data.
- **Key Flows**: 
    - Dashboard (overview of current shift/tasks).
    - Shift Schedule (calendar/list view).
    - Handover Form (structured multi-category input).
    - Admin Panel (staff management, category configuration).

## 3. Key Product Decisions & Trade-Offs

- **Data Management**: Using Supabase for real-time capabilities and structured relational data.
- **State Management**: React state for UI, Supabase for persistence.
- **Security**: Row Level Security (RLS) in Supabase ensures users only access their relevant data.

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────┐
│            Frontend (React)           │
│ (Dashboard, Handover, Schedule, Admin)│
└───────────────────┬───────────────────┘
                    │ Supabase JS SDK
┌───────────────────▼───────────────────┐
│          Supabase (Backend)           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Auth     │ │ Postgres │ │ RLS      ││
│ └──────────┘ └──────────┘ └──────────┘│
└───────────────────────────────────────┘
```

### Data Model
- **profiles**: id, full_name, role, is_active.
- **shifts**: id, name, start_time, end_time, color_code.
- **shift_assignments**: id, shift_id, profile_id, shift_date, status.
- **handovers**: id, shift_date, shift_from_id, shift_to_id, giver_profile_id, receiver_profile_id, status (draft/pending/received/revision_needed), total_patients, categories_data, lab_conditions, pending_tasks, status_logs.
- **handover_categories**: id, name, order, is_active.
- **pending_tasks**: id, handover_id, task_type, description, priority, status, assigned_to.
- **audit_logs**: id, user_id, action, target_table, target_id, changes.

## 5. Handover (Operan Shift) & History Implementation Status
- **Persistent Handover Data**: Seeded initial handovers and fortified `dataService.ts` against empty overwrites. Handover submissions now reliably persist to both localStorage cache and Supabase with full metadata (`created_at`, `updated_at`, `pending_tasks`, and audit trails).
- **Tabbed Interface in Serah Terima**:
  1. **Operan Masuk**: Highlights pending handovers for the receiving officer with full details (patients count, equipment warnings, critical cito tasks) and one-click "Konfirmasi Diterima" / "Minta Revisi".
  2. **Formulir Serah Terima**: Multi-category input with instant submission feedback dialog and URL tracking.
  3. **Data & Riwayat Operan**: Embedded searchable archive of all past handovers with filter and PDF export capabilities.
- **Notifications & Badges**: Realtime counter badges in the desktop sidebar, mobile drawer, and NotificationBell to notify the receiving officer immediately upon handover submission.
