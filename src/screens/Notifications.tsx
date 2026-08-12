import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Screen } from '../components/Screen'
import { BottomNav } from '../components/BottomNav'
import { Spinner } from '../components/Spinner'
import { Empty } from '../components/Empty'
import { useAsync } from '../lib/useAsync'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../data/queries'
import { supabase } from '../lib/supabase'
import { dateOf, timeOf } from '../lib/format'
import { useAuth } from '../auth/AuthProvider'
import { useI18n } from '../lib/i18n'

/**
 * Renders the notifications the platform wrote, rather than deriving them from
 * booking state. Copy lives in notification_templates, so this screen shows
 * whatever the platform decided to say — one source of truth across email,
 * WhatsApp and here.
 */
export function Notifications() {
  const { session } = useAuth()
  const { lang } = useI18n()
  const rows = useAsync(
    () => (session ? fetchNotifications() : Promise.resolve([])),
    [session?.user.id],
  )

  // Initial fetch, subscribe, then re-fetch once the channel confirms. Without
  // the third step anything created between the fetch and the socket going live
  // is delivered to nobody and counted by nobody.
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('my-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${session.user.id}`,
        },
        () => rows.reload(),
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') rows.reload()
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user.id])

  if (!session)
    return (
      <Screen nav={<BottomNav />}>
        <Header />
        <Empty title="Nothing yet" note="Sign in to see replies from venues." />
        <Link to="/signin" className="btn mx-5 mt-2 block">
          Sign in
        </Link>
      </Screen>
    )

  const list = rows.data ?? []
  const unread = list.filter((n) => !n.read_at).length

  async function readAll() {
    await markAllNotificationsRead()
    rows.reload()
  }

  return (
    <Screen nav={<BottomNav unread={unread} />}>
      <Header />
      {unread > 0 && (
        <button className="smallcaps px-5 pb-2 pt-1 text-[9px] text-goldt" onClick={readAll}>
          Mark all read
        </button>
      )}
      {rows.loading && <Spinner />}
      {!rows.loading && list.length === 0 && (
        <Empty
          title="No messages"
          note="Replies from venues, reminders and waitlist openings all arrive here."
        />
      )}
      {list.map((n) => {
        const tpl = n.notification_templates
        const title =
          lang === 'ar' && tpl?.title_ar ? tpl.title_ar : (tpl?.title_en ?? n.template_key)
        const body = lang === 'ar' && tpl?.body_ar ? tpl.body_ar : tpl?.body_en
        const filled = body ? fill(body, n.params) : null
        const inner = (
          <>
            <span
              className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
              style={{
                background: n.read_at ? 'transparent' : 'var(--gold)',
                border: n.read_at ? '1px solid var(--hair)' : 'none',
              }}
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-[13.5px] text-fg">{title}</h5>
              {filled && (
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{filled}</p>
              )}
              <p className="smallcaps pt-2 text-[8.5px] text-muted">
                {dateOf(n.created_at)} · {timeOf(n.created_at)}
              </p>
            </div>
          </>
        )
        return n.booking_id ? (
          <Link
            key={n.id}
            to={`/booking/${n.booking_id}`}
            onClick={() => !n.read_at && markNotificationRead(n.id)}
            className="flex gap-3.5 border-b border-hair2 px-5 py-4"
          >
            {inner}
          </Link>
        ) : (
          <div key={n.id} className="flex gap-3.5 border-b border-hair2 px-5 py-4">
            {inner}
          </div>
        )
      })}
      <div className="h-10" />
    </Screen>
  )
}

/** Templates carry {{1}}-style placeholders; params supplies the values. */
function fill(body: string, params: Record<string, unknown> | null): string {
  if (!params) return body
  return body.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    const v = params[key]
    return v === undefined || v === null ? '' : String(v)
  })
}

function Header() {
  return (
    <div className="px-5 pb-2 pt-[max(52px,env(safe-area-inset-top))]">
      <p className="text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
        Alerts
      </p>
    </div>
  )
}
