import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex w-full gap-3", className)}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-blue-500 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted border rounded-lg px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">AI is thinking</span>
          <div className="flex gap-1 ml-2">
            <div 
              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div 
              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div 
              className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 