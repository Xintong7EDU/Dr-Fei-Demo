import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, BarChart, Users, Calendar, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PresetQuestionsProps {
  onQuestionClick: (question: string) => void
  disabled?: boolean
  className?: string
  meetingIds?: number[]
}

interface PresetQuestion {
  id: string
  text: string
  icon: React.ReactNode
  category: 'overview' | 'analysis' | 'action-items' | 'participants'
}

/**
 * Preset questions component for the AI meeting assistant
 * Provides quick access to common meeting-related questions
 */
export function PresetQuestions({ 
  onQuestionClick, 
  disabled = false, 
  className,
  meetingIds = []
}: PresetQuestionsProps) {
  
  const hasContext = meetingIds.length > 0
  
  // Define preset questions based on context availability
  const presetQuestions: PresetQuestion[] = hasContext ? [
    {
      id: 'stocks-discussed',
      text: 'What stocks have we talked about?',
      icon: <TrendingUp className="h-4 w-4" />,
      category: 'analysis'
    },
    {
      id: 'meeting-summary',
      text: 'Give me a summary of our meetings',
      icon: <MessageSquare className="h-4 w-4" />,
      category: 'overview'
    }
  ] : [
  ]

  const handleQuestionClick = (question: string) => {
    if (!disabled) {
      onQuestionClick(question)
    }
  }

  if (!hasContext && meetingIds.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-sm font-medium text-muted-foreground">Quick Start</div>
        <div className="grid grid-cols-1 gap-2">
          {presetQuestions.map((question) => (
            <Button
              key={question.id}
              variant="outline"
              size="sm"
              onClick={() => handleQuestionClick(question.text)}
              disabled={disabled}
              className="justify-start gap-2 h-auto py-2 px-3 text-left whitespace-normal"
            >
              {question.icon}
              <span className="text-sm">{question.text}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-muted-foreground">
        Quick Questions
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {presetQuestions.map((question) => (
          <Button
            key={question.id}
            variant="outline"
            size="sm"
            onClick={() => handleQuestionClick(question.text)}
            disabled={disabled}
            className="justify-start gap-2 h-auto py-2 px-3 text-left whitespace-normal hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
          >
            {question.icon}
            <span className="text-sm">{question.text}</span>
          </Button>
        ))}
      </div>
    </div>
  )
} 