"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CalendarIcon, ArchiveIcon, BookOpenIcon } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
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
    </nav>
  )
}
