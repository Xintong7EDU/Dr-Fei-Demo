# AI Chat with Meeting Notes Context - TODO List

## Phase 1: Core Infrastructure Setup
- [ ] **1.1** Install AI/LLM dependencies
  - Add OpenAI SDK (`npm install openai`)
  - Add AI SDK for streaming (`npm install ai`)
  - Add vector database client for embeddings (optional for advanced search)

- [ ] **1.2** Create AI service layer
  - Create `lib/ai-service.ts` for OpenAI integration
  - Implement text summarization functions
  - Implement chat completion with context injection
  - Add error handling and rate limiting

- [ ] **1.3** Environment setup
  - Add OpenAI API key to environment variables
  - Update `.env.example` with new required variables

## Phase 2: Meeting Notes Summarization
- [ ] **2.1** Extend MeetingNote type
  - Add `summary` field to MeetingNote interface
  - Add `summary_generated_at` timestamp field
  - Update database schema if needed

- [ ] **2.2** Create summarization service
  - Create `lib/meeting-summary.ts`
  - Implement `generateSummary(noteContent: string)` function
  - Implement `updateMeetingNoteSummary(noteId: number)` function
  - Add batch summarization for existing notes

- [ ] **2.3** Auto-summarization workflow
  - Hook into existing note creation/update flow
  - Trigger summarization when notes exceed certain length
  - Store summaries in database

## Phase 3: Chat Interface Components
- [ ] **3.1** Create chat UI components
  - Create `components/ai-chat/chat-container.tsx`
  - Create `components/ai-chat/message-bubble.tsx`
  - Create `components/ai-chat/chat-input.tsx`
  - Create `components/ai-chat/typing-indicator.tsx`

- [ ] **3.2** Chat state management
  - Create `hooks/use-chat.ts` for chat state
  - Implement message history management
  - Add loading states and error handling

- [ ] **3.3** Meeting context selector
  - Create `components/ai-chat/meeting-context-selector.tsx`
  - Allow users to select which meetings to include in context
  - Show selected meetings with summaries

## Phase 4: Context Integration
- [ ] **4.1** Context preparation service
  - Create `lib/chat-context.ts`
  - Implement `prepareMeetingContext(meetingIds: number[])` function
  - Combine summaries and relevant details
  - Optimize context length for token limits

- [ ] **4.2** Chat API endpoints
  - Create `app/api/chat/route.ts` for streaming chat
  - Implement context injection logic
  - Add proper error handling and validation

- [ ] **4.3** Advanced context features
  - Implement semantic search across meeting notes (optional)
  - Add relevance scoring for context selection
  - Implement context truncation strategies

## Phase 5: User Interface Integration
- [ ] **5.1** Chat page/modal
  - Create `app/chat/page.tsx` or modal component
  - Integrate all chat components
  - Add responsive design

- [ ] **5.2** Navigation integration
  - Add chat link to main navigation
  - Create floating chat button (optional)
  - Add chat access from meeting detail pages

- [ ] **5.3** Meeting integration
  - Add "Chat about this meeting" button to meeting pages
  - Pre-select current meeting context
  - Show relevant chat history

## Phase 6: Enhanced Features
- [ ] **6.1** Chat history persistence
  - Create chat sessions table in database
  - Store chat history with context metadata
  - Implement chat session management

- [ ] **6.2** Smart context suggestions
  - Suggest relevant meetings based on chat topic
  - Auto-include recent or related meetings
  - Implement meeting relevance algorithms

- [ ] **6.3** Export and sharing
  - Add chat export functionality
  - Create shareable chat summaries
  - Generate action items from chat

## Phase 7: Performance and Polish
- [ ] **7.1** Optimization
  - Implement streaming responses
  - Add response caching where appropriate
  - Optimize context preparation performance

- [ ] **7.2** Error handling and UX
  - Add comprehensive error boundaries
  - Implement retry mechanisms
  - Add loading states and progress indicators

- [ ] **7.3** Testing
  - Unit tests for AI service functions
  - Integration tests for chat flow
  - E2E tests for complete user journey

## Phase 8: Security and Deployment
- [ ] **8.1** Security measures
  - Implement rate limiting for AI API calls
  - Add input sanitization and validation
  - Secure API endpoints with proper authentication

- [ ] **8.2** Monitoring and analytics
  - Add usage tracking for AI features
  - Monitor API costs and usage
  - Add error logging and alerting

- [ ] **8.3** Documentation
  - Update README with AI chat features
  - Add user guide for chat functionality
  - Document API endpoints and usage

## Implementation Priority
1. **High Priority**: Phases 1-4 (Core functionality)
2. **Medium Priority**: Phase 5 (UI Integration)
3. **Low Priority**: Phases 6-8 (Enhanced features and polish)

## Estimated Timeline
- **Phase 1-2**: 2-3 days
- **Phase 3-4**: 3-4 days  
- **Phase 5**: 2-3 days
- **Phase 6-8**: 4-5 days (optional enhancements)

**Total Core Implementation**: ~1-2 weeks
**Full Feature Set**: ~2-3 weeks 