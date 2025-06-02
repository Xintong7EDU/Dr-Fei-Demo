"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for participants - in a real app, this would come from a database
interface Participant {
  id: string
  name: string
  role: string
  avatar?: string
  initials: string
}

interface MeetingParticipantsProps {
  className?: string
}

export function MeetingParticipants({ className }: MeetingParticipantsProps) {
  // In a real app, you would fetch participants from an API
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "Dr. Fei Li", role: "Supply Chain Expert", initials: "FL" },
    { id: "2", name: "John Smith", role: "Logistics Manager", initials: "JS" },
    { id: "3", name: "Sarah Johnson", role: "Procurement Specialist", initials: "SJ" },
    { id: "4", name: "Michael Chen", role: "Operations Director", initials: "MC" },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ name: "", role: "" })

  const handleAddParticipant = () => {
    if (newParticipant.name.trim() === "") return
    
    const initials = newParticipant.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    
    setParticipants([
      ...participants,
      {
        id: Date.now().toString(),
        name: newParticipant.name,
        role: newParticipant.role || "Attendee",
        initials
      }
    ])
    
    setNewParticipant({ name: "", role: "" })
    setShowAddForm(false)
  }

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  return (
    <Card className={cn("shadow-sm hover:shadow-md transition-all", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {participants.map((participant) => (
              <div 
                key={participant.id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {participant.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{participant.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{participant.role}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                  onClick={() => handleRemoveParticipant(participant.id)}
                  aria-label={`Remove ${participant.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <div className="border rounded-md p-3 space-y-3">
              <div>
                <label htmlFor="name" className="text-xs font-medium block mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-1.5 text-sm rounded-md border bg-background"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label htmlFor="role" className="text-xs font-medium block mb-1">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  className="w-full px-3 py-1.5 text-sm rounded-md border bg-background"
                  value={newParticipant.role}
                  onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                  placeholder="Enter role (optional)"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.name.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => setShowAddForm(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Participant
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 