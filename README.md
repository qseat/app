# QSeat — customer web app (`app.qseat.qa`)

The complete customer experience as a responsive web app, on the same Supabase
project, RPCs and edge functions as the portals. Both the end-to-end test of the
platform and a working product if App Store publication is delayed.

Nocturne theme, mobile-first, capped at 520px so it stays app-like on desktop.
Dark and light, English and Arabic with full RTL.

## What changed in this version

Three contract changes from the platform repo, plus the remaining features.

**1. Images now go through Supabase transformations.** Confirmed available on
this project by probing the render endpoint. `mediaUrl(path, { width, height })`
in `src/lib/media.ts` builds render URLs; WebP is negotiated automatically from
the Accept header. Measured on a real cover: **57,750 B → 2,572 B at width 400**,
a 22× reduction. Every venue and area image in the app is sized for its slot.

Focal point is deliberately **not** part of `mediaUrl()` — the render endpoint
offers `cover`/`contain`/`fill` and nothing for choosing which part of the frame
survives a crop. `focalStyle(x, y)` returns `object-position` instead, kept
separate so no function returns a URL that silently ignores half its arguments.

**2. The waitlist join now calls `join_waitlist()`.** The direct INSERT grant was
narrowed server-side to five columns, withholding `status`, `offered_at` and
`claim_expires_at` — a client that could set those could self-offer and then
claim the offer it had just written. The INSERT remains as a fallback and sends
only the five permitted columns.

**3. Account deletion is a three-step sequence.** `request_account_deletion()`
cannot remove the `auth.users` row, because auth is platform-owned — it returns
`auth_user_remains: true`. Stopping there leaves someone signed in to an empty
account, which reads as a bug and does not satisfy Apple's requirement. So
`src/lib/deletion.ts` calls the RPC, then the `delete-auth-user` edge function,
then signs out. Step two is best-effort: if it fails the data is already erased,
so we sign out and say so rather than stranding the person.

**Requires an edge function this app cannot provide:** `delete-auth-user`, which
removes the credential using the service-role key. Until it exists, deletion
erases the data and reports that the sign-in is still being removed.

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
| `/` | Home — search, trending terms, filters, map link, hero with live meridian, areas, collections, venue rows with ratings |
| `/map` | Leaflet + OpenStreetMap, gold markers, tap for a venue card (lazy-loaded) |
| `/places` | All areas |
| `/area/:slug` | Venues in an area |
| `/collection/:slug` | An editorial collection |
| `/venue/:slug` | Photos, favourite, rating, description, rooms, hours, reviews |
| `/book/:slug` | Room → guests → date → time → preferences → occasion → request; full slots join the waitlist |
| `/booking/:id` | Status, counter-proposal accept/decline, running late, guest list RSVP, concierge extras, cancel, review CTA |
| `/waitlist` | Queued and offered tables, claim within the hold window |
| `/review/:id` | Overall plus service / ambience / value, and a note |
| `/checkin` | Rotating QR from `checkin-token`, fallback code, countdown |
| `/activity` | Notifications from the platform, live over realtime |
| `/bookings` | Your bookings, upcoming and earlier |
| `/saved` | Favourites and named lists |
| `/me` | Profile, priority status, language, appearance, legal, account deletion, sign out |

Every write goes through the RPCs — `acquire_hold`, `create_booking`,
`transition_booking`, `join_waitlist`, `claim_waitlist_offer`,
`request_account_deletion`. Nothing writes `bookings.status` directly.

## The realtime rule this app follows

`SUBSCRIBED` means the join was acknowledged, not that the replication stream is
carrying rows. Anything created between an initial fetch and the socket going
live is delivered to nobody and counted by nobody. So every subscription here
does **initial fetch → subscribe → re-fetch on SUBSCRIBED**. The notifications
screen is the reference implementation.

## Degrades rather than breaks

Every query added after the first release returns an empty result if its
migration is absent, so this build runs against an older database and the
features simply stay dark:

- `notifications` and `notification_templates` — the alerts screen
- `favourites`, `saved_lists`, `reviews` — saving and reviewing
- `get_venue_availability_summary` — the feed's meridian
- `get_venue_points` — the map
- `collections`, `trending_terms`, `priority_flags`, `feature_flags`
- `join_waitlist`, `claim_waitlist_offer` — the waitlist
- `profiles` — name and phone fall back to `auth.users.user_metadata`

## Not built

- **Web push.** Realtime covers an open tab; nothing reaches a closed one. Needs
  a service worker and VAPID keys, and is deferred alongside WhatsApp.
- **Apple Wallet passes** (`BOOK-23`), **recurring bookings** (`BOOK-22`),
  **venue stories** (`VEN-15`), **360° previews** (`VEN-16`), **geofence assist**
  (`CHK-08`), **companion check-in** (`CHK-09`).
- **Arabic venue content** shows the Arabic field when a venue supplied one and
  falls back to English when not. Interface strings are fully translated.

## Verify against the database if a screen errors

- `bookings` → `venue_spaces` uses `venue_spaces!bookings_space_belongs_to_venue`
  because two foreign keys point at that table.
- `booking_guests` insert assumes `booking_id` and `display_name` are grantable;
  update sends only `rsvp_status` and `responded_at`.
- `notifications` update sends only `read_at`.
- `checkin-token` returns `{ token, seconds_remaining, fallback_code }`.
