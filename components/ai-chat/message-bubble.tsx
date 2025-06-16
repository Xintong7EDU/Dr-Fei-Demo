import { memo } from 'react'
import { ChatMessage } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MessageBubbleProps {
  message: ChatMessage
  className?: string
}

export const MessageBubble = memo(function MessageBubble({ 
  message, 
  className 
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn(
      "flex w-full gap-3",
      isUser && "justify-end",
      className
    )}>
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-3 text-sm",
        isUser && "bg-blue-500 text-white ml-auto",
        isAssistant && "bg-muted border"
      )}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser && "text-blue-100",
          isAssistant && "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-gray-500 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}) 