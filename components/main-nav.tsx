"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { CalendarIcon, BarChart, MessageSquare, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"

export function MainNav() {
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    const { error } = await signOut()
    
    if (error) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out of your account.'
      })
    }
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: CalendarIcon,
    },
    {
      name: "AI Chat",
      href: "/ai-chat",
      icon: MessageSquare,
    },
    {
      name: "Stocks",
      href: "/stocks",
      icon: BarChart,
    },
  ]

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link href="/" className="flex items-center space-x-2">
        <CalendarIcon className="h-6 w-6" />
        <span className="font-bold inline-block">Meeting Manager</span>
      </Link>
      {user && (
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
      )}
      <div className="ml-auto flex items-center space-x-2">
        <ThemeToggle />
        {loading ? (
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        ) : user ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-foreground/60">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="default" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
