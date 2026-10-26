# Supabase Backend Setup & Deployment Guide
## Ball Badminton Live — Phase 2.2 Architecture

This document provides complete instructions for connecting the **Ball Badminton Live** application to a live **Supabase PostgreSQL** cloud backend, applying migrations, establishing Row Level Security (RLS) policies, deploying authoritative scoring RPC functions, and provisioning the primary **Super Admin** account (`akashakashr505@gmail.com`).

---

## 1. Prerequisites & Overview

- **Supabase Cloud Account**: [https://database.new](https://database.new) (free tier supported)
- **Node.js**: v18+ or v24+
- **Vite & React 19 Frontend**: Located in `d:\ballbadmiton website`

The application features a **Dual-Mode Data Layer**:
- **Live Supabase Mode**: Automatically activates when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `.env.local`. All reads, writes, transactions, and live court scoring use PostgreSQL and Supabase Realtime.
- **Local Prototype Mode**: Active when environment variables are omitted or invalid. Seamlessly stores data in the browser's `localStorage` and memory caches with full fidelity, concurrency simulation, and data persistence warnings.

---

## 2. Supabase Project Setup

1. Log into your Supabase Dashboard and click **New project**.
2. Select your Organization, enter a project name (e.g., `ball-badminton-live`), and generate a secure database password.
3. Choose a region close to your primary audience (e.g., `ap-south-1` Mumbai).
4. Wait approximately 1-2 minutes for the database cluster to provision.

---

## 3. Environment Variables Configuration

In the project root, copy the environment template:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project credentials (found in **Project Settings -> API**):

```env
# Supabase Project URL (e.g. https://xyzcompany.supabase.co)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Public Anonymous Key (safe for client-side browser usage)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Data Layer Mode: 'auto' (default), 'supabase', or 'demo'
VITE_DATA_LAYER_MODE=auto
```

> **Security Note:** Never expose the `service_role` secret key in client environment variables. The client application strictly uses the publishable anonymous key and relies on PostgreSQL Row Level Security (RLS) and Security Definer RPC functions for authorization.

---

## 4. Applying PostgreSQL Database Migrations

The migrations are located in the `supabase/migrations/` directory and must be executed in order:

### Option A: Using the Supabase Dashboard SQL Editor (Recommended for Quick Setup)

Navigate to **SQL Editor** in the Supabase Dashboard and execute the SQL migration files in this sequence:

1. **`supabase/migrations/20261025000001_initial_schema.sql`**
   - Provisions all 13 core relational tables:
     - `profiles`: User identities with RBAC roles (`super_admin`, `tournament_admin`, `official_scorer`, `viewer`).
     - `scoring_configs`: BBFI standard rules (29 points per set, deuce up to 33, two-hands service rotation).
     - `tournaments`: Tournaments, dates, venues, categories, prize pools, and status.
     - `teams`: Registered teams, home cities, state associations, and color tokens.
     - `players`: Athlete profiles, jersey numbers, BBFI registration IDs, and court positions.
     - `tournament_teams` & `team_rosters`: Relational linking tables with unique constraints.
     - `matches`: Court fixtures, categories, scheduled times, and real-time live status.
     - `match_lineups`: 5-player on-court configurations and 4 substitutes per match.
     - `match_games`: Per-set game scores, status, and set winners.
     - `score_events`: Complete immutable chronological log of every rally, ace, and fault.
     - `scorer_assignments`: Court officials and certified BBFI scorers assigned to matches.
     - `audit_logs`: Immutable security audit trail recording all administrative operations.

2. **`supabase/migrations/20261025000002_rls_and_policies.sql`**
   - Enables Row Level Security (RLS) on all 13 tables.
   - Creates secure helper functions (`get_current_user_role()`, `is_super_admin()`, `is_tournament_admin()`, `can_score_match()`).
   - Configures granular security policies:
     - Public read-only access to published tournaments, teams, and live scoreboards.
     - Tournament administrators can only update their assigned events.
     - Official scorers can only award points in matches where they are actively assigned.
     - Read-only viewers have zero write access.
     - Super Admins have comprehensive administrative authority.

3. **`supabase/migrations/20261025000003_scoring_rpc_functions.sql`**
   - Implements transactional, atomic PostgreSQL RPC functions:
     - `start_match_rpc(p_match_id)`: Validates match status, snapshots BBFI scoring rules, initializes Game 1, and marks status as `live`.
     - `record_point_rpc(...)`: Validates scorer authority, checks optimistic concurrency (`p_expected_version`), enforces idempotency (`p_idempotency_key`), evaluates BBFI 29-point set wins and 33-point sudden death caps, and handles two-hands service rotation.
     - `undo_last_point_rpc(p_match_id, ...)`: Authoritative rollback of the most recent score event and set state.
     - `pause_match_rpc(...)`: Safely pauses live court play (e.g. rain delays, court maintenance).
     - `complete_match_rpc(...)`: Finalizes match results and locks scoring.

4. **`supabase/migrations/20261025000004_initial_seed_and_admin.sql`**
   - Configures an automatic trigger on `auth.users` that creates a `public.profiles` record when any user registers.
   - **Guarantees that `akashakashr505@gmail.com` is automatically assigned the `super_admin` role** upon sign-up or confirmation.
   - Deploys the privileged `grant_user_role(...)` RPC function for Super Admin role management.
   - Seeds BBFI default scoring rules and starter state associations.

### Option B: Using the Supabase CLI

```bash
# Login to Supabase CLI
npx supabase login

# Link your local project to your remote Supabase project
npx supabase link --project-ref your-project-id

# Push all migrations
npx supabase db push
```

---

## 5. Provisioning the Initial Super Administrator

1. Start the application (`npm run dev`) or navigate to the sign-up screen.
2. Register an account with:
   - **Email:** `akashakashr505@gmail.com`
   - **Password:** Choose a secure password
   - **Full Name:** Akash R
3. The database trigger `on_auth_user_created` will automatically recognize `akashakashr505@gmail.com` and grant:
   - `role = 'super_admin'`
   - `designation = 'Platform Super Admin & Owner'`
   - `is_active = true`
4. Log into the Admin Dashboard at `/admin`. You will have full access to:
   - Tournament Management
   - Team & Player Rosters
   - Live Court Scorer Console
   - Access Control & Role Delegation (`/admin/settings`)
   - Platform Configuration

---

## 6. Granting Access to Additional Administrators & Scorers

Once logged in as `akashakashr505@gmail.com`, you can delegate privileges securely from **Admin -> Settings -> Tab 2 (Access Control & Roles)**:

1. Click **+ Grant Access**.
2. Enter the user's name, email, and choose their role:
   - **Tournament Administrator:** Can manage tournaments, register teams, and schedule fixtures.
   - **Official Scorer:** Can score assigned matches on the court scoreboard.
   - **Viewer:** Read-only analyst access to the administrative dashboard.
3. The role is securely registered via the `grant_user_role` database function and audited in `audit_logs`.

---

## 7. Migrating Prototype Data to Live Supabase

If you populated tournaments, teams, or scorers in the prototype storage:

1. Navigate to **Admin -> Settings -> Tab 3 (Supabase Backend Integration)**.
2. Test your database connection using **Test Connection** (measures live round-trip latency).
3. Click **Push Local Prototype to Supabase**.
4. The migration engine validates relational integrity and imports all records into PostgreSQL.
5. You can also export/import JSON backups at any time.

---

## 8. Verifying Realtime Subscriptions

Supabase Realtime is enabled for the `matches`, `match_games`, and `score_events` tables:
- Open the public match center (`/matches/:id`) in one browser window.
- Open the live court scorer console (`/admin/matches`) in another browser window.
- Score a point (+1 Team 1).
- The public scoreboard updates instantly without page reload.
- The connection indicator displays **Connected (Realtime)** with automatic stale data detection (45s threshold).

---

## 9. Running Verification Tests

Run the comprehensive automated test suite (43 unit & integration tests covering auth, RLS, scoring rules, versioning, idempotency, and migration):

```bash
# Run unit & integration tests
npm test

# Run TypeScript compiler & production build
npm run build
```
