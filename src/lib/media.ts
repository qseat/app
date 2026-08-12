import { SUPABASE_URL } from './env'

/**
 * Supabase image transformations are enabled on this project — confirmed by
 * probing the render endpoint. WebP is negotiated automatically from the Accept
 * header, so we never request a format.
 *
 * Measured on a real venue cover: 57,750 B original → 2,572 B at width 400.
 * On Doha mobile data that is the difference between the feed feeling instant
 * and feeling broken, so every venue image in the app goes through here.
 */
export interface MediaOpts {
  width?: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

const BUCKETS = { venue: 'venue-media', area: 'area-media' } as const
export type Bucket = keyof typeof BUCKETS

export function mediaUrl(
  storagePath: string | null | undefined,
  opts: MediaOpts = {},
  bucket: Bucket = 'venue',
): string | null {
  if (!storagePath) return null
  const name = BUCKETS[bucket]

  // No transform requested — serve the original object.
  if (!opts.width && !opts.height) {
    return `${SUPABASE_URL}/storage/v1/object/public/${name}/${storagePath}`
  }

  const q = new URLSearchParams()
  if (opts.width) q.set('width', String(opts.width))
  if (opts.height) q.set('height', String(opts.height))
  q.set('quality', String(opts.quality ?? 72))
  q.set('resize', opts.resize ?? 'cover')
  return `${SUPABASE_URL}/storage/v1/render/image/public/${name}/${storagePath}?${q}`
}

/**
 * Focal point is NOT a transformation parameter — the render endpoint offers
 * cover/contain/fill and nothing for choosing which part of the frame survives
 * a crop. So it is object-position on the element the image fills, kept
 * separate from mediaUrl() rather than folded in, because a single function
 * would return a URL that silently ignored half its arguments.
 */
export function focalStyle(
  x?: number | null,
  y?: number | null,
): { objectPosition: string } {
  return { objectPosition: `${x ?? 50}% ${y ?? 50}%` }
}

/** Widths used across the app, so callers don't invent their own. */
export const W = {
  thumb: 200,
  tile: 400,
  row: 320,
  hero: 900,
  gallery: 1000,
} as const
