import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses RLS, so it MUST only be used inside
 * server-side code that has already validated the caller (public writes are
 * validated + sanitized; admin writes require a valid admin session).
 * The service-role key is never sent to the browser.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
