"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/auth-js"
import { supabase } from "@/lib/supabase"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session)
      setIsLoading(false)
    })
    const {
      data: { subscription },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setIsLoading(false)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, isLoading }
}
