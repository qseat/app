# QSeat — customer web app (`app.qseat.qa`)

The full customer experience as a responsive web app. Same Supabase project, same
RPCs and same edge functions as the portals, so it is a genuine end-to-end test
of the platform — and a working product if App Store publication is delayed.

Nocturne theme, mobile-first, capped at 520px so it stays app-like on a desktop.

## Run it

```bash
pnpm install          # or npm install
cp .env.example .env.local
# add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (anon key only)
pnpm dev
```

The build **fails** if either variable is missing rather than throwing in the
browser. Vite inlines env at build time, so changing them on Vercel needs a
redeploy with "Use existing Build Cache" unticked.

## Deploy

New Vercel project from this repo. Framework preset **Vite**, build `pnpm build`,
output `dist`. Add both `VITE_` variables to Production and Preview. Domain
`app.qseat.qa`, then add `https://app.qseat.qa/**` to Supabase →
Authentication → URL Configuration → Redirect URLs.

## What is here

| Route | Screen |
|---|---|
| `/intro` | First-run introduction (01 Discover, 02 Reserve, 03 Arrive) |
| `/signin` | Email + password sign in and sign up |
| `/` | Home — search, hero venue with the availability meridian, areas rail, venue rows |
| `/places` | All areas |
| `/area/:slug` | Venues in an area |
| `/venue/:slug` | Photos, actions, description, rooms, hours accordion |
| `/book/:slug` | Room → guests → date → time → preferences → occasion → request |
| `/booking/:id` | Status, counter-proposal accept/decline, cancel |
| `/checkin` | Rotating QR from `checkin-token`, fallback code, countdown |
| `/activity` | Bookings grouped upcoming / earlier, attention states |
| `/me` | Profile, appearance, legal links, sign out |

Every write goes through the RPCs — `acquire_hold`, `create_booking`,
`transition_booking`. Nothing writes `bookings.status` directly.

## Known gaps in this slice

- **Meridian data is a placeholder.** The home feed draws a fixed pattern.
  A venue-level availability summary RPC is needed to make it real, since
  `get_available_slots` is per space and calling it per venue per card is too
  many round trips.
- **`profiles` (migration 0017) is not deployed yet.** Name and phone fall back
  to `auth.users.user_metadata`; the queries degrade rather than throw.
- **Not built yet:** map view, waitlist, saved lists and favourites, reviews,
  guest-list RSVP, concierge extras, editorial collections, trending search,
  Arabic RTL layout, push notifications.
- **Notifications do not exist anywhere on the platform yet** — a booking
  request only reaches a venue while someone has the portal open.

## Things to verify against the database

The select strings assume column names from the schema as built. If any query
returns an error, check these first:

- `bookings` → `venue_spaces` uses the explicit constraint
  `venue_spaces!bookings_space_belongs_to_venue`, because two foreign keys point
  at that table. Confirm the constraint name with:
  ```sql
  select conname from pg_constraint
  where conrelid = 'bookings'::regclass and confrelid = 'venue_spaces'::regclass;
  ```
- `areas.hero_media_url` is read through the `venue-media` bucket.
- `get_available_slots` returns a single sentinel row with a null `slot_start`
  and an `unavailable_reason` when a day yields nothing.
- `checkin-token` is expected to return `{ token, seconds_remaining, fallback_code }`.
