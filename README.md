# NexusForge Agency - Internal Team Dashboard
**Domain:** `teams.nexusforgeagency.in`  
**Tech Stack:** Next.js (App Router), Tailwind CSS, Firebase Auth, Supabase (PostgreSQL with RLS), Lucide React.

---

## 🎨 Design System & Strict UI Constraints
- **Color Palette:** Muted Pastels (Soft Lavender `#FAF9FE`/`#866CE6`, Muted Mint `#F3FAF6`/`#369E7F`, Pale Peach `#FDF8F5`/`#CE7454`, Sky Blue `#F4F8FD`/`#4489D0`, Slate Gray for typography).
- **Geometric Shapes:** **STRICTLY NO PILL SHAPES (`rounded-full`)**. All elements (buttons, inputs, cards, avatars, badges) use soft squares and standard rectangles (`rounded-md` or `rounded-lg`).
- **Interactions:** Subtle scaling (`hover:scale-[1.02]`), soft shadow expansions (`hover:shadow-lg`), and fluid transitions (`transition-all duration-300`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase project keys and Supabase URL/Anon key:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="teams-nexusforge.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="teams-nexusforge"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="teams-nexusforge.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:...:web:..."

NEXT_PUBLIC_SUPABASE_URL="https://xyzcompany.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

### 3. Apply Supabase Schema & RLS
Run `supabase/schema.sql` in your Supabase SQL Editor. It generates:
- `team_members` table
- `tasks` table with status checking
- `content_items` table
- `requesting_firebase_uid()` PostgreSQL helper
- Production Row Level Security (RLS) policies

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🔐 Firebase Auth + Supabase RLS Integration

### How it Works:
1. **Firebase Authentication:** Users sign in via Google Workspace or Email/Password on `/login`.
2. **ID Token Extraction:** Firebase mints an RS256 JWT signed with Google's public certificates. The user's UID is in the `sub` claim.
3. **Supabase Dynamic Token Forwarding:** In `lib/supabase.ts`, the Supabase client automatically fetches `await auth.currentUser.getIdToken()` and sets it as the `Authorization: Bearer <token>` header for all database requests.
4. **PostgreSQL RLS:** In Supabase, the custom function `requesting_firebase_uid()` extracts `request.jwt.claims ->> 'sub'`, allowing granular permissions:
   ```sql
   create policy "Allow author delete on tasks"
     on public.tasks for delete
     using (created_by = requesting_firebase_uid());
   ```

