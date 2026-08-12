export interface Area {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  description_en: string | null
  hero_media_url: string | null
  hero_focal_x?: number | null
  hero_focal_y?: number | null
  display_order: number | null
}

export interface VenueMedia {
  storage_path: string
  media_type: string
  is_cover: boolean | null
  display_order: number | null
  focal_x?: number | null
  focal_y?: number | null
}

export interface VenueSummary {
  id: string
  slug: string
  name_en: string
  name_ar: string | null
  price_band: number | null
  area_id: string
  areas?: { name_en: string; slug: string } | null
  venue_media?: VenueMedia[]
}

export interface VenueSpace {
  id: string
  venue_id: string
  name_en: string
  name_ar: string | null
  description_en: string | null
  space_type: string | null
  capacity: number
  min_party: number
  max_party: number
  is_active: boolean | null
  display_order: number | null
  space_media?: {
    storage_path: string
    is_cover: boolean | null
    focal_x?: number | null
    focal_y?: number | null
  }[]
}

export interface VenueHours {
  day_of_week: number
  opens_at: string
  closes_at: string
  closes_next_day: boolean | null
}

export interface VenueDetail extends VenueSummary {
  description_en: string | null
  description_ar: string | null
  phone: string | null
  whatsapp_phone: string | null
  website_url: string | null
  address_en: string | null
  venue_spaces?: VenueSpace[]
  venue_hours?: VenueHours[]
}

/** One row from get_available_slots. A sentinel row has null slot_start. */
export interface Slot {
  slot_start: string | null
  slot_end: string | null
  remaining_capacity: number | null
  is_priority_only: boolean | null
  unavailable_reason: string | null
}

export interface Booking {
  id: string
  venue_id: string
  space_id: string
  status: string
  slot_start: string
  slot_end: string
  party_size: number
  occasion: string | null
  special_requests: string | null
  assigned_space_label: string | null
  counter_proposed_slot_start: string | null
  sla_expires_at: string | null
  grace_expires_at: string | null
  venues?: { name_en: string; slug: string } | null
  venue_spaces?: { name_en: string } | null
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  preferred_language: string | null
}

export interface AvailabilitySummary {
  venue_id: string
  open_slots: number
  next_slot: string | null
  pattern: boolean[] | null
  reason: string | null
}

export interface Rating {
  venue_id: string
  rating: number
  review_count: number
}

export interface Review {
  id: string
  booking_id: string
  venue_id: string
  overall: number
  service: number | null
  ambience: number | null
  value_rating: number | null
  body: string | null
  created_at: string
}

export interface SavedList {
  id: string
  name: string
  saved_list_items?: { venue_id: string }[]
}

export interface WaitlistEntry {
  id: string
  venue_id: string
  space_id: string | null
  desired_slot_start: string
  party_size: number
  status: string
  claim_expires_at?: string | null
  venues?: { name_en: string; slug: string } | null
}

export interface VenuePoint {
  id: string
  slug: string
  name_en: string
  lat: number
  lng: number
}

export interface Taxonomy {
  id: string
  slug: string
  name_en: string
}
