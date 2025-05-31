# Architecture Overview

This project is a small meeting management system built with **Next.js** using
the App Router. Client components live under the `app/` directory while common
UI elements are found in `components/`.

Data is persisted in **Supabase**. Two service classes in `lib/` wrap database
operations:

- `MeetingsService` provides CRUD access to meeting records.
- `MeetingNotesService` manages notes associated with each meeting.

Both services expect an initialized `SupabaseClient` instance and return
strongly typed data defined in `lib/types.ts`.

Authentication utilities in `lib/auth.js` integrate with Supabase Auth and are
used by React hooks in `hooks/` to keep the UI in sync with the current session.

Tests under `lib/__tests__/` exercise the service classes using Node's built-in
test runner.
