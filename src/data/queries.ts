import { supabase } from '../lib/supabase'
import type { Area, Booking, Profile, Slot, VenueDetail, VenueSummary } from './types'

/*
 * NOTE ON EMBEDS
 * `bookings` has two foreign keys to `venue_spaces` (space_id and
 * counter_proposed_space_id), so PostgREST cannot resolve `venue_spaces(...)`
 * implicitly. Every booking query names the constraint explicitly:
 *   venue_spaces!bookings_space_belongs_to_venue(name_en)
 * If the constraint is renamed in a migration, these break loudly. Verify with:
 *   select conname from pg_constraint
 *   where conrelid = 'bookings'::regclass and confrelid = 'venue_spaces'::regclass;
 */
const SPACE_EMBED = 'venue_spaces!bookings_space_belongs_to_venue(name_en)'

const VENUE_CARD = `
  id, slug, name_en, name_ar, price_band, area_id,
  areas(name_en, slug),
  venue_media(storage_path, media_type, is_cover, display_order, focal_x, focal_y)
`

export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id, slug, name_en, name_ar, description_en, hero_media_url, hero_focal_x, hero_focal_y, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Area[]
}

export async function fetchVenues(opts: { areaId?: string; limit?: number } = {}) {
  let q = supabase.from('venues').select(VENUE_CARD).eq('status', 'published')
  if (opts.areaId) q = q.eq('area_id', opts.areaId)
  const { data, error } = await q.limit(opts.limit ?? 50)
  if (error) throw error
  return (data ?? []) as unknown as VenueSummary[]
}

export async function searchVenues(term: string) {
  const like = `%${term.replace(/[%_]/g, '')}%`
  const { data, error } = await supabase
    .from('venues')
    .select(VENUE_CARD)
    .eq('status', 'published')
    .or(`name_en.ilike.${like},name_ar.ilike.${like}`)
    .limit(30)
  if (error) throw error
  return (data ?? []) as unknown as VenueSummary[]
}

export async function fetchVenue(slug: string): Promise<VenueDetail> {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `
      id, slug, name_en, name_ar, description_en, description_ar, price_band, area_id,
      phone, whatsapp_phone, website_url, address_en,
      areas(name_en, slug),
      venue_media(storage_path, media_type, is_cover, display_order, focal_x, focal_y),
      venue_hours(day_of_week, opens_at, closes_at, closes_next_day),
      venue_spaces(
        id, venue_id, name_en, name_ar, description_en, space_type,
        capacity, min_party, max_party, is_active, display_order,
        space_media(storage_path, is_cover, focal_x, focal_y)
      )
    `,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) throw error
  return data as unknown as VenueDetail
}

export async function fetchSlots(
  spaceId: string,
  dateKey: string,
  partySize: number,
): Promise<Slot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_space_id: spaceId,
    p_date: dateKey,
    p_party_size: partySize,
  })
  if (error) throw error
  return (data ?? []) as Slot[]
}

export async function acquireHold(
  spaceId: string,
  slotStart: string,
  partySize: number,
): Promise<string> {
  const { data, error } = await supabase.rpc('acquire_hold', {
    p_space_id: spaceId,
    p_slot_start: slotStart,
    p_party_size: partySize,
  })
  if (error) throw error
  return data as string
}

export interface CreateBookingInput {
  holdId: string
  partySize: number
  occasion?: string | null
  specialRequests?: string | null
  preferences?: { amenity_id: string; is_negated: boolean }[]
  extras?: { extra_type: string; note?: string }[]
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_hold_id: input.holdId,
    p_party_size: input.partySize,
    p_occasion: input.occasion ?? null,
    p_special_requests: input.specialRequests ?? null,
    p_preferences: input.preferences ?? [],
    p_extras: input.extras ?? [],
  })
  if (error) throw error
  return data as string
}

export async function transitionBooking(
  bookingId: string,
  toStatus: string,
  reason: string,
  payload: Record<string, unknown> = {},
) {
  const { error } = await supabase.rpc('transition_booking', {
    p_booking_id: bookingId,
    p_to_status: toStatus,
    p_actor_type: 'guest',
    p_reason: reason,
    p_payload: payload,
  })
  if (error) throw error
}

const BOOKING_SELECT = `
  id, venue_id, space_id, status, slot_start, slot_end, party_size,
  occasion, special_requests, assigned_space_label,
  counter_proposed_slot_start, sla_expires_at, grace_expires_at,
  venues(name_en, slug),
  ${SPACE_EMBED}
`

export async function fetchMyBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .neq('status', 'draft')
    .order('slot_start', { ascending: false })
    .limit(80)
  if (error) throw error
  return (data ?? []) as unknown as Booking[]
}

export async function fetchBooking(id: string): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as Booking
}

export async function fetchAmenities() {
  const { data, error } = await supabase
    .from('amenities')
    .select('id, slug, name_en')
    .eq('is_active', true)
    .order('display_order', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as { id: string; slug: string; name_en: string }[]
}

/** Config the app is allowed to see — whitelisted server-side. */
export async function fetchPublicConfig(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('get_public_config')
  if (error) throw error
  return (data ?? {}) as Record<string, unknown>
}

/* ---- check-in ---- */

export interface CheckinToken {
  token: string
  seconds_remaining: number
  fallback_code?: string
}

export async function issueCheckinToken(bookingId: string): Promise<CheckinToken> {
  const { data, error } = await supabase.functions.invoke('checkin-token', {
    body: { booking_id: bookingId },
  })
  if (error) throw error
  return data as CheckinToken
}

/* ---- profile ----
 * profiles arrives in migration 0017. Until it is deployed these return null /
 * no-op rather than throwing, so the app runs against the current database.
 */

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, preferred_language')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    if (isMissingRelation(error)) return null
    throw error
  }
  return (data ?? null) as Profile | null
}

export async function saveProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch }, { onConflict: 'id' })
  if (error && !isMissingRelation(error)) throw error
}

function isMissingRelation(error: { code?: string; message?: string }) {
  return error.code === '42P01' || /relation .*profiles.* does not exist/i.test(error.message ?? '')
}

/* ============================================================================
 * Slice two — availability summaries, favourites, lists, reviews, waitlist,
 * map points and filter taxonomies. Requires migration 0018_app_support.sql.
 * Every function degrades to an empty result if the migration is not applied,
 * so the app keeps working while the database catches up.
 * ========================================================================= */

import type {
  AvailabilitySummary,
  Rating,
  Review,
  SavedList,
  Taxonomy,
  VenuePoint,
  WaitlistEntry,
} from './types'

function missing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST202' ||
    /does not exist|could not find/i.test(error.message ?? '')
  )
}

export async function fetchAvailabilitySummary(
  venueIds: string[],
  dateKey: string,
  partySize = 2,
): Promise<Record<string, AvailabilitySummary>> {
  if (!venueIds.length) return {}
  const { data, error } = await supabase.rpc('get_venue_availability_summary', {
    p_venue_ids: venueIds,
    p_date: dateKey,
    p_party_size: partySize,
  })
  if (error) {
    if (missing(error)) return {}
    throw error
  }
  const out: Record<string, AvailabilitySummary> = {}
  for (const row of (data ?? []) as AvailabilitySummary[]) out[row.venue_id] = row
  return out
}

export async function fetchRatings(venueIds: string[]): Promise<Record<string, Rating>> {
  if (!venueIds.length) return {}
  const { data, error } = await supabase.rpc('get_venue_ratings', { p_venue_ids: venueIds })
  if (error) {
    if (missing(error)) return {}
    throw error
  }
  const out: Record<string, Rating> = {}
  for (const r of (data ?? []) as Rating[]) out[r.venue_id] = r
  return out
}

/* ---- favourites ---- */

export async function fetchFavouriteIds(): Promise<string[]> {
  const { data, error } = await supabase.from('favourites').select('venue_id')
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []).map((r: { venue_id: string }) => r.venue_id)
}

export async function toggleFavourite(venueId: string, on: boolean) {
  if (on) {
    const { data: me } = await supabase.auth.getUser()
    if (!me.user) throw new Error('Sign in to save places')
    const { error } = await supabase
      .from('favourites')
      .insert({ user_id: me.user.id, venue_id: venueId })
    if (error && error.code !== '23505' && !missing(error)) throw error
  } else {
    const { error } = await supabase.from('favourites').delete().eq('venue_id', venueId)
    if (error && !missing(error)) throw error
  }
}

export async function fetchFavouriteVenues(): Promise<VenueSummary[]> {
  const ids = await fetchFavouriteIds()
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('venues')
    .select(VENUE_CARD)
    .eq('status', 'published')
    .in('id', ids)
  if (error) throw error
  return (data ?? []) as unknown as VenueSummary[]
}

/* ---- saved lists ---- */

export async function fetchLists(): Promise<SavedList[]> {
  const { data, error } = await supabase
    .from('saved_lists')
    .select('id, name, saved_list_items(venue_id)')
    .order('created_at', { ascending: true })
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as unknown as SavedList[]
}

export async function createList(name: string): Promise<string> {
  const { data: me } = await supabase.auth.getUser()
  if (!me.user) throw new Error('Sign in first')
  const { data, error } = await supabase
    .from('saved_lists')
    .insert({ user_id: me.user.id, name })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function addToList(listId: string, venueId: string) {
  const { error } = await supabase
    .from('saved_list_items')
    .insert({ list_id: listId, venue_id: venueId })
  if (error && error.code !== '23505') throw error
}

export async function removeFromList(listId: string, venueId: string) {
  const { error } = await supabase
    .from('saved_list_items')
    .delete()
    .eq('list_id', listId)
    .eq('venue_id', venueId)
  if (error) throw error
}

/* ---- reviews ---- */

export async function fetchVenueReviews(venueId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, booking_id, venue_id, overall, service, ambience, value_rating, body, created_at')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as Review[]
}

export interface ReviewInput {
  bookingId: string
  venueId: string
  overall: number
  service?: number | null
  ambience?: number | null
  value?: number | null
  body?: string | null
}

export async function submitReview(input: ReviewInput) {
  const { data: me } = await supabase.auth.getUser()
  if (!me.user) throw new Error('Sign in first')
  const { error } = await supabase.from('reviews').insert({
    booking_id: input.bookingId,
    venue_id: input.venueId,
    user_id: me.user.id,
    overall: input.overall,
    service: input.service ?? null,
    ambience: input.ambience ?? null,
    value_rating: input.value ?? null,
    body: input.body?.trim() || null,
  })
  if (error) throw error
}

export async function fetchMyReviewFor(bookingId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, booking_id, venue_id, overall, service, ambience, value_rating, body, created_at')
    .eq('booking_id', bookingId)
    .maybeSingle()
  if (error) {
    if (missing(error)) return null
    throw error
  }
  return (data ?? null) as Review | null
}

/* ---- waitlist (BOOK-14) ---- */

/**
 * join_waitlist() is the correct path — it validates what an INSERT cannot and
 * is idempotent, so a double tap returns the existing entry rather than a
 * second place in the queue.
 *
 * The direct INSERT is kept only as a fallback for a database without the RPC,
 * and it now sends exactly five columns: the grant was narrowed server-side to
 * withhold status, offered_at and claim_expires_at, because a client that could
 * set those could self-offer and then claim the offer it had just written.
 * Sending any of them raises 42501.
 */
export async function joinWaitlist(
  venueId: string,
  spaceId: string | null,
  desiredSlotStart: string,
  partySize: number,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('join_waitlist', {
    p_venue_id: venueId,
    p_space_id: spaceId,
    p_desired_slot_start: desiredSlotStart,
    p_party_size: partySize,
  })
  if (!error) return (data as string) ?? null
  if (!missing(error)) throw error

  const { data: me } = await supabase.auth.getUser()
  if (!me.user) throw new Error('Sign in first')
  const { error: insErr } = await supabase.from('waitlist_entries').insert({
    venue_id: venueId,
    space_id: spaceId,
    desired_slot_start: desiredSlotStart,
    party_size: partySize,
    guest_id: me.user.id,
  })
  if (insErr) throw insErr
  return null
}

/** Claim an offered table. Acquires a hold and creates the booking atomically. */
export async function claimWaitlistOffer(entryId: string): Promise<string> {
  const { data, error } = await supabase.rpc('claim_waitlist_offer', {
    p_entry_id: entryId,
  })
  if (error) throw error
  return data as string
}

export async function leaveWaitlist(entryId: string) {
  const { error } = await supabase
    .from('waitlist_entries')
    .update({ status: 'cancelled' })
    .eq('id', entryId)
  if (error && !missing(error)) throw error
}

export async function fetchMyWaitlist(): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from('waitlist_entries')
    .select(
      'id, venue_id, space_id, desired_slot_start, party_size, status, claim_expires_at, venues(name_en, slug)',
    )
    .in('status', ['waiting', 'offered'])
    .order('desired_slot_start', { ascending: true })
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as unknown as WaitlistEntry[]
}

/* ---- map (DISC-05) ---- */

/**
 * PostgREST cannot return a geography column usefully, so coordinates come from
 * a lightweight view/RPC if one exists, and otherwise fall back to nothing —
 * the map then shows the area centroid only.
 */
export async function fetchVenuePoints(): Promise<VenuePoint[]> {
  const { data, error } = await supabase.rpc('get_venue_points')
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as VenuePoint[]
}

/* ---- filter taxonomies (DISC-08) ---- */

export async function fetchTaxonomies(): Promise<{
  categories: Taxonomy[]
  vibes: Taxonomy[]
  cuisines: Taxonomy[]
  amenities: Taxonomy[]
}> {
  const pick = (t: string) =>
    supabase.from(t).select('id, slug, name_en').eq('is_active', true).order('display_order', {
      ascending: true,
      nullsFirst: false,
    })
  const [c, v, cu, a] = await Promise.all([
    pick('categories'),
    pick('vibes'),
    pick('cuisines'),
    pick('amenities'),
  ])
  const val = (r: { data: unknown; error: unknown }) =>
    (r.error ? [] : ((r.data ?? []) as Taxonomy[]))
  return {
    categories: val(c),
    vibes: val(v),
    cuisines: val(cu),
    amenities: val(a),
  }
}

export interface VenueFilters {
  areaId?: string | null
  categoryIds?: string[]
  amenityIds?: string[]
  priceBands?: number[]
}

export async function fetchVenuesFiltered(f: VenueFilters): Promise<VenueSummary[]> {
  let q = supabase.from('venues').select(VENUE_CARD).eq('status', 'published')
  if (f.areaId) q = q.eq('area_id', f.areaId)
  if (f.priceBands?.length) q = q.in('price_band', f.priceBands)
  const { data, error } = await q.limit(60)
  if (error) throw error
  let rows = (data ?? []) as unknown as VenueSummary[]

  // Category and amenity live in join tables. Filtering client-side keeps this
  // to one round trip at launch volumes; move it into an RPC once the catalogue
  // grows past a few hundred venues.
  if (f.categoryIds?.length) {
    const { data: links } = await supabase
      .from('venue_categories')
      .select('venue_id')
      .in('category_id', f.categoryIds)
    const ok = new Set((links ?? []).map((r: { venue_id: string }) => r.venue_id))
    rows = rows.filter((v) => ok.has(v.id))
  }
  if (f.amenityIds?.length) {
    const { data: links } = await supabase
      .from('venue_amenities')
      .select('venue_id')
      .in('amenity_id', f.amenityIds)
    const ok = new Set((links ?? []).map((r: { venue_id: string }) => r.venue_id))
    rows = rows.filter((v) => ok.has(v.id))
  }
  return rows
}

/* ============================================================================
 * Final slice — in-app notifications, priority access, collections, trending
 * search, guest list RSVP, concierge extras, feature flags.
 * Every one degrades to an empty result if its migration is absent.
 * ========================================================================= */

export interface Notification {
  id: string
  template_key: string
  params: Record<string, unknown> | null
  booking_id: string | null
  read_at: string | null
  created_at: string
  notification_templates?: {
    title_en: string
    title_ar: string | null
    body_en: string
    body_ar: string | null
  } | null
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, template_key, params, booking_id, read_at, created_at, notification_templates(title_en, title_ar, body_en, body_ar)',
    )
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as unknown as Notification[]
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error && !missing(error)) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error && !missing(error)) throw error
}

/** Admin-granted recognition. Never purchasable, never a badge to earn. */
export async function fetchPriorityStatus(): Promise<boolean> {
  const { data, error } = await supabase
    .from('priority_flags')
    .select('user_id')
    .is('revoked_at', null)
    .maybeSingle()
  if (error) return false
  return !!data
}

/** Feature flags, so the client can hide what the platform has not enabled. */
export async function fetchFeatureFlags(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.rpc('get_public_config')
  if (error) return {}
  const cfg = (data ?? {}) as Record<string, unknown>
  const flags = cfg.feature_flags
  if (flags && typeof flags === 'object') return flags as Record<string, boolean>
  return {}
}

export interface Collection {
  id: string
  slug: string
  title_en: string
  title_ar: string | null
  subtitle_en: string | null
  cover_path: string | null
}

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('id, slug, title_en, title_ar, subtitle_en, cover_path')
    .eq('is_published', true)
    .order('display_order', { ascending: true, nullsFirst: false })
    .limit(12)
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as Collection[]
}

export async function fetchCollectionVenues(slug: string): Promise<VenueSummary[]> {
  const { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (!col) return []
  const { data: items } = await supabase
    .from('collection_items')
    .select('venue_id')
    .eq('collection_id', (col as { id: string }).id)
  const ids = (items ?? []).map((r: { venue_id: string }) => r.venue_id)
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('venues')
    .select(VENUE_CARD)
    .eq('status', 'published')
    .in('id', ids)
  if (error) throw error
  return (data ?? []) as unknown as VenueSummary[]
}

export async function fetchTrendingTerms(): Promise<string[]> {
  const { data, error } = await supabase
    .from('trending_terms')
    .select('term')
    .eq('is_active', true)
    .order('display_order', { ascending: true, nullsFirst: false })
    .limit(8)
  if (error) return []
  return (data ?? []).map((r: { term: string }) => r.term)
}

/* ---- guest list RSVP (BOOK-20) ---- */

export interface BookingGuest {
  id: string
  display_name: string | null
  rsvp_status: string
  invite_token: string
}

export async function fetchBookingGuests(bookingId: string): Promise<BookingGuest[]> {
  const { data, error } = await supabase
    .from('booking_guests')
    .select('id, display_name, rsvp_status, invite_token')
    .eq('booking_id', bookingId)
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as BookingGuest[]
}

export async function inviteGuest(bookingId: string, displayName: string) {
  const { error } = await supabase
    .from('booking_guests')
    .insert({ booking_id: bookingId, display_name: displayName })
  if (error) throw error
}

/** Only rsvp_status, responded_at and display_name are writable — see rule 11. */
export async function respondToInvite(entryId: string, accept: boolean) {
  const { error } = await supabase
    .from('booking_guests')
    .update({
      rsvp_status: accept ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', entryId)
  if (error) throw error
}

/* ---- concierge extras (BOOK-21) ---- */

export interface BookingExtra {
  id: string
  extra_type: string
  note: string | null
  status: string
}

export async function fetchBookingExtras(bookingId: string): Promise<BookingExtra[]> {
  const { data, error } = await supabase
    .from('booking_extras')
    .select('id, extra_type, note, status')
    .eq('booking_id', bookingId)
  if (error) {
    if (missing(error)) return []
    throw error
  }
  return (data ?? []) as BookingExtra[]
}

export async function requestExtra(bookingId: string, extraType: string, note: string) {
  const { error } = await supabase
    .from('booking_extras')
    .insert({ booking_id: bookingId, extra_type: extraType, note: note || null })
  if (error) throw error
}
