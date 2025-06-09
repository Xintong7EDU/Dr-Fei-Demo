"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { revalidateMeetings } from "@/app/actions"

interface RefreshButtonProps {
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  label?: string
  showLabel?: boolean
}

/**
 * Refresh button component that revalidates meeting data
 * Provides visual feedback during refresh operation
 */
export function RefreshButton({ 
  className, 
  size = "sm", 
  variant = "outline", 
  label = "Refresh",
  showLabel = true 
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // Use the server action to revalidate meetings data
      const result = await revalidateMeetings()
      
      if (result.success) {
        // Trigger a router refresh to show the updated data
        router.refresh()
      } else {
        console.error('Failed to refresh data:', result.error)
      }
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "transition-all duration-200",
        isRefreshing && "opacity-75",
        className
      )}
      aria-label={`${label} data`}
    >
      <RefreshCw 
        className={cn(
          "h-4 w-4",
          isRefreshing && "animate-spin",
          showLabel && "mr-2"
        )} 
      />
      {showLabel && (
        <span>{isRefreshing ? "Refreshing..." : label}</span>
      )}
    </Button>
  )
} 