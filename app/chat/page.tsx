/**
 * Chat page - Main chat interface
 * Integrates threads, messages, and input components
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { Card } from '@/components/ui/card' // Unused
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThreadList } from '@/components/chat/ThreadList'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChat } from '@/hooks/use-chat'
import { useSession } from '@/hooks/use-session'
import { AlertCircle, MessageSquare, RefreshCw } from 'lucide-react'

/**
 * Chat layout component
 */
const ChatLayout: React.FC<{
  children: React.ReactNode
  sidebar: React.ReactNode
}> = ({ children, sidebar }) => {
  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sidebar}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}

/**
 * Empty state when no thread is selected
 */
const EmptyThreadState: React.FC<{
  onCreateThread: () => void
}> = ({ onCreateThread }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Start a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Create a new chat to ask questions about your notes and get AI-powered insights with citations.
          </p>
        </div>
        <Button onClick={onCreateThread}>
          Start New Chat
        </Button>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="text-xs">
            Note summaries
          </Badge>
          <Badge variant="outline" className="text-xs">
            Action items
          </Badge>
          <Badge variant="outline" className="text-xs">
            Meeting insights
          </Badge>
        </div>
      </div>
    </div>
  )
}

/**
 * Error state component
 */
const ErrorState: React.FC<{
  error: string
  onRetry: () => void
  onDismiss: () => void
}> = ({ error, onRetry, onDismiss }) => {
  return (
    <Alert className="m-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Main chat page component
 */
export default function ChatPage() {
  const router = useRouter()
  const { session, isLoading: isSessionLoading } = useSession()
  
  const {
    threads,
    activeThread,
    messages,
    streamingMessage,
    isLoadingThreads,
    isLoadingMessages,
    isStreaming,
    isSending,
    error,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    sendMessage,
    stopGeneration,
    clearError,
    refreshThreads,
  } = useChat()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push('/login')
    }
  }, [session, isSessionLoading, router])

  // Handle thread creation
  const handleCreateThread = async () => {
    const newThread = await createThread()
    if (newThread) {
      await selectThread(newThread.id)
    }
  }

  // Handle note click from citations
  // const handleNoteClick = (noteId: number) => {
  //   // Navigate to notes page with the specific note
  //   router.push(`/?note=${noteId}`)
  // }

  if (isSessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <ChatLayout
      sidebar={
        <ThreadList
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onThreadSelect={selectThread}
          onCreateThread={handleCreateThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
          isLoading={isLoadingThreads}
        />
      }
    >
      {/* Error display */}
      {error && (
        <ErrorState
          error={error}
          onRetry={refreshThreads}
          onDismiss={clearError}
        />
      )}

      {/* Main chat area */}
      {activeThread ? (
        <>
          {/* Chat header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {activeThread.title || 'New Chat'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} message{messages.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isStreaming && (
                  <Badge variant="secondary" className="animate-pulse">
                    Generating...
                  </Badge>
                )}
                {isSending && !isStreaming && (
                  <Badge variant="secondary">
                    Sending...
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <MessageList
            messages={messages}
            isLoading={isLoadingMessages}
            streamingMessage={streamingMessage}
          />

          {/* Input */}
          <ChatInput
            onSendMessage={sendMessage}
            onStopGeneration={stopGeneration}
            isLoading={isSending}
            isStreaming={isStreaming}
            disabled={!activeThread}
            placeholder="Ask about your notes..."
          />
        </>
      ) : (
        <EmptyThreadState onCreateThread={handleCreateThread} />
      )}
    </ChatLayout>
  )
}
