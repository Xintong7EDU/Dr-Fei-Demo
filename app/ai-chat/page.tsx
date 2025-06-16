import { ChatContainer } from '@/components/ai-chat/chat-container'

export default function AIChatPage() {
  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Meeting Assistant</h1>
        <p className="text-muted-foreground">
          Chat with AI about your meetings, get summaries, and discuss action items.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatContainer className="h-full" />
      </div>
    </div>
  )
} 