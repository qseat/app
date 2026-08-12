import { supabase } from './supabase'

/**
 * Account deletion is three steps, and stopping after the first leaves the
 * person signed in to an empty account — which reads as a bug and does not
 * satisfy Apple's in-app deletion requirement.
 *
 *   1. request_account_deletion()  — nulls profile identity, detaches bookings,
 *      strips the venue's dossier while preserving its own cover counters,
 *      revokes invite tokens. Returns auth_user_remains: true, because auth is
 *      platform-owned and SQL cannot remove that row.
 *   2. delete-auth-user edge function — removes the credential with the
 *      service-role key, which must never reach the browser.
 *   3. signOut() — locally, so no stale session survives.
 *
 * Step 2 is best-effort: if it fails the person's data is already erased and
 * only a dormant credential remains, so we sign out and report rather than
 * leaving them stuck on a half-deleted account.
 */
export interface DeletionResult {
  erased: boolean
  credentialRemoved: boolean
  note?: string
}

export async function deleteMyAccount(): Promise<DeletionResult> {
  const { error: rpcError } = await supabase.rpc('request_account_deletion')
  if (rpcError) throw rpcError

  let credentialRemoved = false
  let note: string | undefined
  try {
    const { error } = await supabase.functions.invoke('delete-auth-user', { body: {} })
    if (error) throw error
    credentialRemoved = true
  } catch (e) {
    note =
      'Your details have been erased. Removing the sign-in itself is still in progress — contact support@qseat.qa if you can still sign in tomorrow.'
  }

  await supabase.auth.signOut()
  return { erased: true, credentialRemoved, note }
}
