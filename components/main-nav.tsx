"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"
import { CalendarIcon, ArchiveIcon, BookOpenIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth"

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: CalendarIcon,
    },
    {
      name: "Schedule",
      href: "/schedule",
      icon: CalendarIcon,
    },
    {
      name: "Archive",
      href: "/archive",
      icon: ArchiveIcon,
    },
    {
      name: "Glossary",
      href: "/glossary",
      icon: BookOpenIcon,
    },
  ]

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link href="/" className="flex items-center space-x-2">
        <CalendarIcon className="h-6 w-6" />
        <span className="font-bold inline-block">Meeting Manager</span>
      </Link>
      <div className="flex items-center space-x-4 ml-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-1 text-sm transition-colors hover:text-foreground/80",
              pathname === item.href ? "text-foreground font-medium" : "text-foreground/60",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      <div className="ml-auto">
        {session ? (
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        ) : (
          <Link href="/login" className="text-sm hover:underline">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  )
}
