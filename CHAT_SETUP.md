# Chat with Notes - Setup Guide

This guide covers setting up the AI chat functionality that provides fast note context retrieval.

## Overview

The chat system provides:
- ✅ **Hybrid retrieval**: Vector similarity + full-text search
- ✅ **Streaming responses**: Real-time token streaming
- ✅ **Citations**: Links back to source notes
- ✅ **Thread management**: Persistent conversations
- ✅ **Real-time updates**: Live message sync

## Prerequisites

1. **Supabase Project** with:
   - PostgreSQL database
   - `pgvector` extension enabled
   - Row Level Security (RLS) configured
   - Edge Functions enabled

2. **OpenAI API Key** for:
   - Text embeddings (`text-embedding-ada-002`)
   - LLM completion (`gpt-4-turbo-preview` or similar)

## Setup Steps

### 1. Database Schema

Run the chat schema migration:

```sql
-- Apply the schema from supabase_chat_schema.sql
-- This creates tables: threads, messages, note_chunks, note_embeddings
-- Plus indexes, RLS policies, and search functions
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Existing Supabase vars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI for embeddings and chat
OPENAI_API_KEY=your_openai_api_key
```

### 3. Deploy Edge Function

Deploy the embedding pipeline:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy the embed-notes function
supabase functions deploy embed-notes
```

### 4. Initial Data Migration

If you have existing notes, run the embedding pipeline:

```bash
# Via Supabase dashboard or API call
curl -X POST 'https://your-project.supabase.co/functions/v1/embed-notes' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": "your-user-id"}'
```

### 5. Install Dependencies

The required packages are already added:

```bash
npm install @langchain/langgraph @langchain/core @radix-ui/react-collapsible
```

## Usage

### Basic Chat Flow

1. **Navigate to `/chat`** - Access via main navigation
2. **Create thread** - Click "+" to start new conversation  
3. **Ask questions** - Type queries about your notes
4. **View citations** - Expand sources under AI responses
5. **Manage threads** - Rename/delete via dropdown menu

### Example Queries

- *"Summarize my meeting notes from this week"*
- *"What action items do I have pending?"*
- *"Find notes about project planning"*
- *"What did we discuss about the budget?"*

### API Endpoints

- `POST /api/chat/sessions` - Create thread
- `GET /api/chat/sessions` - List threads  
- `POST /api/chat/messages` - Send message (streaming)
- `DELETE /api/chat/sessions?id=...` - Delete thread

## Architecture

### Components

- **ThreadList** - Sidebar with conversation history
- **MessageList** - Chat messages with citations
- **ChatInput** - Message composition with streaming
- **Citations** - Expandable source references

### Data Flow

1. **User message** → API route
2. **Hybrid retrieval** → Vector + full-text search
3. **Context assembly** → Top chunks with citations
4. **LLM streaming** → Real-time token generation
5. **Message persistence** → Save to database
6. **Real-time sync** → Update UI via Supabase Realtime

### Performance

- **P50 latency**: ~600ms to first token
- **Retrieval**: 15-20 relevant chunks in <200ms
- **Context budget**: 3000-4000 tokens max
- **Streaming**: Immediate token display

## Troubleshooting

### Common Issues

1. **No search results**
   - Check if notes are embedded: `SELECT COUNT(*) FROM note_embeddings`
   - Trigger manual embedding: Call `embed-notes` function
   - Verify `pgvector` extension is enabled

2. **Slow responses**
   - Monitor OpenAI API latency
   - Check database query performance with `EXPLAIN ANALYZE`
   - Tune `IVFFLAT` index parameters

3. **Authentication errors**
   - Verify RLS policies are applied
   - Check user session in API routes
   - Confirm service role key for Edge Functions

4. **Missing citations**
   - Ensure note titles are populated
   - Check chunk-to-note relationships
   - Verify retrieval is finding relevant content

### Monitoring

Key metrics to track:
- Retrieval precision (relevant chunks in top-K)
- End-to-end latency (query → first token)
- User satisfaction (thumbs up/down)
- Error rates by component

## Development

### Local Testing

```bash
# Start development server
npm run dev

# Test embedding pipeline locally
supabase functions serve embed-notes

# Run with mock providers (no OpenAI required)
# Set OPENAI_API_KEY="" to use mock embeddings/LLM
```

### Adding Features

Common extensions:
- **File upload** - Extend notes with PDF/document support
- **Advanced tools** - Add web search, calculation, etc.
- **Team sharing** - Multi-user thread permissions
- **Analytics** - Usage dashboards and insights

## Next Steps

1. **Test the flow** - Create notes, start chats, verify citations
2. **Monitor performance** - Check latency and accuracy
3. **Gather feedback** - User experience and relevance
4. **Scale considerations** - Index tuning, caching, costs

For issues or questions, refer to the PRD in `docs/chat-notes-prd.md`.
