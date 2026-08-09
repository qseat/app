# QSeat — customer web app (`app.qseat.qa`)

The full customer experience as a responsive web app, on the same Supabase
project, RPCs and edge functions as the portals. A genuine end-to-end test of
the platform, and a working product if App Store publication is delayed.

Nocturne theme, mobile-first, capped at 520px so it stays app-like on desktop.
Dark and light, English and Arabic with full RTL.

## Before you deploy this version

Apply **`0018_app_support.sql`** (delivered alongside this project) through
Claude Code in the `qseat` repo. It adds:

- `get_venue_availability_summary()` — one availability answer per venue, so the
  feed's availability meridian shows real data instead of a placeholder
- `favourites`, `saved_lists`, `saved_list_items` with guest-only RLS
- `reviews` with a policy that only permits a review of a booking that actually
  arrived, plus `get_venue_ratings()`
- registration of the new grants in `qseat_meta.table_privileges`, so
  `pnpm db:audit` and the pgTAP equality assertion still pass
- `bookings` added to the realtime publication

Every new query degrades to an empty result if the migration is not applied, so
this build runs against the current database either way — features simply stay
dark until the migration lands.

## Run it

```bash
pnpm install
cp .env.example .env.local        # VITE_SUPABASE_URL + anon key
pnpm dev
```

The build **fails** on missing config rather than throwing in the browser. Vite
inlines env at build time, so changing a Vercel variable needs a redeploy with
"Use existing Build Cache" unticked.

## Routes

| Route | Screen |
|---|---|
| `/intro` | First run — 01 Discover, 02 Reserve, 03 Arrive |
| `/signin` | Sign in and sign up |
| `/` | Home — search, filters, map link, hero with live meridian, areas, venue rows with ratings |
| `/map` | Leaflet + OpenStreetMap, gold markers, tap for a venue card (lazy-loaded) |
| `/places` | All areas |
| `/area/:slug` | Venues in an area |
| `/venue/:slug` | Photos, favourite, rating, description, rooms, hours, reviews |
| `/book/:slug` | Room → guests → date → time → preferences → occasion → request; full slots join the waitlist |
| `/booking/:id` | Status, counter-proposal accept/decline, running late +10/+15/+30, cancel, review CTA |
| `/review/:id` | Overall plus service / ambience / value, and a note |
| `/checkin` | Rotating QR from `checkin-token`, fallback code, countdown |
| `/activity` | Bookings grouped upcoming / earlier, live via realtime |
| `/saved` | Favourites and named lists |
| `/me` | Profile, language, appearance, legal, sign out |

Every write goes through the RPCs — `acquire_hold`, `create_booking`,
`transition_booking`. Nothing writes `bookings.status` directly.

## Still not built

- **Notifications.** The platform has no notification service (`SYS-04`). The app
  updates live over realtime while it is open, but nothing reaches a guest or a
  venue when it is closed. **This is the largest remaining gap in the product**,
  not just in this app — a booking request can currently be created that nobody
  ever sees.
- **`profiles` (migration 0017).** Name and phone fall back to
  `auth.users.user_metadata` until it ships; queries degrade rather than throw.
- **Map coordinates** need a `get_venue_points()` RPC returning `id, slug,
  name_en, lat, lng` — PostgREST cannot return a geography column directly. The
  map renders and explains itself until then. Suggested:
  ```sql
  create or replace function public.get_venue_points()
  returns table (id uuid, slug text, name_en text, lat double precision, lng double precision)
  language sql stable security definer set search_path = '' as $$
    select v.id, v.slug, v.name_en,
           st_y(v.location::geometry), st_x(v.location::geometry)
    from public.venues v where v.status = 'published';
  $$;
  ```
- Guest-list RSVP (`BOOK-20`), concierge extras (`BOOK-21`), recurring bookings
  (`BOOK-22`), Apple Wallet passes, priority access (`PRI-*`), editorial
  collections, trending search terms, venue stories, 360° previews.
- Arabic copy is translated for interface strings; venue content shows the
  Arabic field when present and falls back to English when not.

## Verify against the database if a screen errors

- `bookings` → `venue_spaces` uses the explicit constraint
  `venue_spaces!bookings_space_belongs_to_venue`, because two foreign keys point
  at that table:
  ```sql
  select conname from pg_constraint
  where conrelid = 'bookings'::regclass and confrelid = 'venue_spaces'::regclass;
  ```
- `waitlist_entries` insert assumes columns `venue_id, space_id,
  desired_slot_start, party_size, guest_id`.
- `checkin-token` is expected to return `{ token, seconds_remaining, fallback_code }`.
- `areas.hero_media_url` is read through the `venue-media` bucket.
