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
- **handovers**: id, shift_date, shift_id, from_user_id, to_user_id, status (draft/pending/received).
- **handover_categories**: id, name, order.
- **handover_items**: id, handover_id, category_id, summary, status.
- **pending_tasks**: id, description, priority, status, assigned_to.
- **audit_logs**: id, user_id, action, target_table, target_id, changes.
