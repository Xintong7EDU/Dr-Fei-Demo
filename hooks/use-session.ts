"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/auth-js"
import { supabase } from "@/lib/supabase"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(({ data }: any) => setSession(data.session))
    const {
      data: { subscription },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return session
}
