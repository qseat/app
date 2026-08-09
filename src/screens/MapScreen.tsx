import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Screen, TopBar } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import { fetchVenuePoints, fetchVenues } from '../data/queries'
import { useI18n } from '../lib/i18n'

const DOHA: L.LatLngTuple = [25.2854, 51.531]

/**
 * Leaflet with OpenStreetMap tiles: no API key, no third-party account. Tiles
 * are a third-party request from Doha, so if latency is poor at launch this is
 * where a keyed provider goes.
 */
export function MapScreen() {
  const { t } = useI18n()
  const host = useRef<HTMLDivElement | null>(null)
  const map = useRef<L.Map | null>(null)
  const [selected, setSelected] = useState<{ slug: string; name: string } | null>(null)

  const points = useAsync(fetchVenuePoints, [])
  const venues = useAsync(() => fetchVenues({ limit: 60 }), [])

  const byId = useMemo(() => {
    const m = new Map<string, string>()
    for (const v of venues.data ?? []) m.set(v.id, v.areas?.name_en ?? '')
    return m
  }, [venues.data])

  useEffect(() => {
    if (!host.current || map.current) return
    map.current = L.map(host.current, { zoomControl: false, attributionControl: true }).setView(
      DOHA,
      12,
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map.current)
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!map.current || !points.data?.length) return
    const layer = L.layerGroup().addTo(map.current)
    const bounds: L.LatLngTuple[] = []
    for (const p of points.data) {
      if (!p.lat || !p.lng) continue
      bounds.push([p.lat, p.lng])
      const icon = L.divIcon({
        className: '',
        html:
          '<span style="display:block;width:14px;height:14px;border-radius:50%;' +
          'background:#C8A961;box-shadow:0 0 0 3px rgba(200,169,97,.28)"></span>',
        iconSize: [14, 14],
      })
      L.marker([p.lat, p.lng], { icon })
        .addTo(layer)
        .on('click', () => setSelected({ slug: p.slug, name: p.name_en }))
    }
    if (bounds.length) map.current.fitBounds(L.latLngBounds(bounds).pad(0.2))
    return () => {
      layer.remove()
    }
  }, [points.data, byId])

  const unavailable = !points.loading && (points.data?.length ?? 0) === 0

  return (
    <Screen nav={<BottomNav />}>
      <TopBar title={t('map')} />
      <div className="relative">
        <div ref={host} className="h-[calc(100vh-230px)] min-h-[420px] w-full bg-card2" />
        {unavailable && (
          <div className="absolute inset-0 grid place-items-center bg-bg/90 px-6">
            <Empty
              title="Map not available yet"
              note="Venue coordinates need a get_venue_points RPC — PostgREST cannot return a geography column directly. Everything else works without it."
            />
          </div>
        )}
        {selected && (
          <Link
            to={`/venue/${selected.slug}`}
            className="absolute inset-x-4 bottom-4 z-[500] border border-hair bg-bg px-4 py-3.5"
          >
            <p className="font-display text-[19px] text-fg">{selected.name}</p>
            <p className="smallcaps mt-1 text-[9px] text-goldt">Open this place ›</p>
          </Link>
        )}
      </div>
    </Screen>
  )
}
