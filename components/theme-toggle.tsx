"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const stored = localStorage.getItem("theme")
    const enabled = stored ? stored === "dark" : root.classList.contains("dark")
    root.classList.toggle("dark", enabled)
    setIsDark(enabled)
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    root.classList.toggle("dark")
    const dark = root.classList.contains("dark")
    setIsDark(dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
