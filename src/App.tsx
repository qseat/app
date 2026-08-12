import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Intro } from './screens/Intro'
import { SignIn } from './screens/SignIn'
import { Home } from './screens/Home'
import { Places } from './screens/Places'
import { AreaDetail } from './screens/AreaDetail'
import { Venue } from './screens/Venue'
import { Book } from './screens/Book'
import { BookingDetail } from './screens/BookingDetail'
import { CheckIn } from './screens/CheckIn'
import { Activity } from './screens/Activity'
import { Notifications } from './screens/Notifications'
import { Waitlist } from './screens/Waitlist'
import { Collection } from './screens/Collection'
import { Profile } from './screens/Profile'
import { Saved } from './screens/Saved'
import { Review } from './screens/Review'
import { I18nProvider } from './lib/i18n'
import { Spinner } from './components/Spinner'

// Leaflet is ~150 kB and only the map needs it, so it loads on demand.
const MapScreen = lazy(() =>
  import('./screens/MapScreen').then((m) => ({ default: m.MapScreen })),
)

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <ScrollReset />
      <Routes>
        <Route path="/intro" element={<Intro />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<Home />} />
        <Route path="/places" element={<Places />} />
        <Route path="/area/:slug" element={<AreaDetail />} />
        <Route path="/collection/:slug" element={<Collection />} />
        <Route path="/venue/:slug" element={<Venue />} />
        <Route path="/book/:slug" element={<Book />} />
        <Route
          path="/booking/:id"
          element={
            <RequireAuth>
              <BookingDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/map"
          element={
            <Suspense fallback={<Spinner full label="Loading the map" />}>
              <MapScreen />
            </Suspense>
          }
        />
        <Route
          path="/saved"
          element={
            <RequireAuth>
              <Saved />
            </RequireAuth>
          }
        />
        <Route
          path="/review/:id"
          element={
            <RequireAuth>
              <Review />
            </RequireAuth>
          }
        />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/activity" element={<Notifications />} />
        <Route path="/bookings" element={<Activity />} />
        <Route
          path="/waitlist"
          element={
            <RequireAuth>
              <Waitlist />
            </RequireAuth>
          }
        />
        <Route path="/me" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
    </I18nProvider>
  )
}
