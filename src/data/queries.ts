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
  venue_media(storage_path, media_type, is_cover, display_order)
`

export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id, slug, name_en, name_ar, description_en, hero_media_url, display_order')
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
      venue_media(storage_path, media_type, is_cover, display_order),
      venue_hours(day_of_week, opens_at, closes_at, closes_next_day),
      venue_spaces(
        id, venue_id, name_en, name_ar, description_en, space_type,
        capacity, min_party, max_party, is_active, display_order,
        space_media(storage_path, is_cover)
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
