import { useEffect } from 'react'
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
import { Profile } from './screens/Profile'

function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollReset />
      <Routes>
        <Route path="/intro" element={<Intro />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/" element={<Home />} />
        <Route path="/places" element={<Places />} />
        <Route path="/area/:slug" element={<AreaDetail />} />
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
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/me" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
