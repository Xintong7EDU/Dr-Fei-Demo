"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteMeeting } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useToastContext } from "@/hooks/use-toast-context"

interface DeleteMeetingButtonProps {
  meetingId: number
  meetingTitle: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function DeleteMeetingButton({
  meetingId,
  meetingTitle,
  variant = "outline",
  size = "sm",
  className = "",
}: DeleteMeetingButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToastContext()

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the meeting "${meetingTitle}"? This action cannot be undone and will also delete all associated notes and Q&A entries.`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteMeeting(meetingId)
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
        variant: "success"
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting meeting:", error)
      toast({
        title: "Error",
        description: "Failed to delete meeting. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${className}`}
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
      {size !== "icon" && <span className="ml-1">{isDeleting ? "Deleting..." : "Delete"}</span>}
    </Button>
  )
} 