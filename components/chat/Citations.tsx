/**
 * Citations component for displaying note references
 * Shows clickable citations with note titles and preview text
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FileText, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import type { Citation } from '@/lib/types'

interface CitationsProps {
  citations: Citation[]
  onNoteClick?: (noteId: number) => void
}

/**
 * Individual citation item component
 */
const CitationItem: React.FC<{
  citation: Citation
  index: number
  onNoteClick?: (noteId: number) => void
}> = ({ citation, index, onNoteClick }) => {
  const handleNoteClick = () => {
    onNoteClick?.(citation.note_id)
  }

  return (
    <Card className="p-3 border-l-4 border-l-primary/50 bg-muted/30">
      <div className="flex items-start gap-2">
        <Badge variant="secondary" className="text-xs font-mono flex-shrink-0">
          {index + 1}
        </Badge>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h4 className="text-sm font-medium truncate">
              {citation.title}
            </h4>
            {onNoteClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-auto flex-shrink-0"
                onClick={handleNoteClick}
                title="Open note"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {citation.text}
          </p>
          
          {citation.chunk_index > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Section {citation.chunk_index + 1}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Main citations component
 */
export const Citations: React.FC<CitationsProps> = ({
  citations,
  onNoteClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>
                {citations.length} source{citations.length === 1 ? '' : 's'}
              </span>
              <FileText className="h-3 w-3" />
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className="space-y-2">
            {citations.map((citation, index) => (
              <CitationItem
                key={`${citation.note_id}-${citation.chunk_id}`}
                citation={citation}
                index={index}
                onNoteClick={onNoteClick}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Inline citation references component
 * For displaying [1], [2], etc. within message text
 */
export const InlineCitations: React.FC<{
  citations: Citation[]
  onCitationClick?: (citationIndex: number) => void
}> = ({ citations, onCitationClick }) => {
  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {citations.map((citation, index) => (
        <Button
          key={`${citation.note_id}-${citation.chunk_id}`}
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-xs font-mono bg-primary/10 hover:bg-primary/20"
          onClick={() => onCitationClick?.(index)}
          title={`Source: ${citation.title}`}
        >
          {index + 1}
        </Button>
      ))}
    </span>
  )
}

/**
 * Citation preview tooltip component
 */
export const CitationTooltip: React.FC<{
  citation: Citation
  children: React.ReactNode
}> = ({ citation, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <Card className="p-2 max-w-xs shadow-lg">
          <div className="text-xs space-y-1">
            <div className="font-medium">{citation.title}</div>
            <div className="text-muted-foreground line-clamp-3">
              {citation.text}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
