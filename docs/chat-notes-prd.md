## Chat with Fast Notes Context — Product Requirements Document (PRD)

### Background
The app manages meetings and notes (see `components/notes-editor.tsx`, `lib/meeting-notes.ts`, `lib/notes.ts`) and includes stock features. We will add an AI chat that instantly leverages a user’s notes as context to answer questions, with citations. Infra uses Next.js App Router (`app/`), Supabase (`lib/supabase.ts`, `supabase_schema.sql`), Tailwind/Shadcn UI, and LangGraph for orchestration.

### Objectives
- Provide a chat experience that:
  - Automatically retrieves relevant note snippets and injects them into the prompt context.
  - Streams responses with citations to notes.
  - Persists threads and messages for continuity.
- Maintain strict security via RLS and reliable performance at scale.

### Success Metrics (MVP)
- **Latency**: P50 time-to-first-token ≤ 600ms; P95 ≤ 1.2s.
- **Relevance**: Top-3 relevant note coverage in ≥ 85% of note-grounded queries (internal eval set).
- **Reliability**: Crash/500 rate < 0.5% per 1K requests.
- **Satisfaction**: ≥ 60% “helpful” thumbs-up in first 2 weeks.

### Users & Use Cases
- Individual users with saved meeting notes:
  - Ask Q&A about their notes.
  - Generate summaries and action items.
  - Retrieve specific facts with citations and jump-to-source.

### Assumptions & Dependencies
- Supabase Postgres with `pgvector`, Realtime, and Auth enabled.
- LLM + embedding provider reachable from server/edge.
- Notes are text/markdown and chunkable.

### Scope
- **In (MVP)**: chat with streaming, threads/messages persistence, hybrid retrieval from notes, citations, RLS, basic tracing.
- **Out (MVP)**: advanced tools beyond notes, rerankers, agents, team/shared notes, orgs, analytics dashboards.

## MVP Requirements

### A) UX
- Chat page:
  - Thread list (recent first), message list with roles, `ChatInput` with Enter-to-send.
  - Streaming assistant responses; loader while retrieving context.
  - Citations under assistant messages with note title and jump-to source.
- Notes:
  - Continue editing in current notes UI. Updates trigger background re-embedding.

### B) Core Flows
- Start chat:
  - Create/select thread; load last k messages (or summary + last k).
- Send message:
  - Persist user message, trigger LangGraph run:
    - In parallel: embed query (dense), BM25 search (sparse), load history.
    - Fuse results, compress to context with citations.
    - Stream model output to client; persist final assistant message.
- Notes ingestion:
  - On create/update, chunk changed notes, embed chunks, upsert embeddings.

### C) API Surface (App Router)
- `POST app/api/chat/sessions`: Create thread. Returns `thread_id`.
- `GET app/api/chat/sessions`: List threads for user.
- `DELETE app/api/chat/sessions?id=...`: Soft delete thread.
- `POST app/api/chat/messages` (SSE/stream): Body `{ thread_id, content }`. Streams assistant tokens; returns final message id on completion.

### D) Orchestration (LangGraph)
- State: `userId`, `threadId`, `messages`, `retrievedChunks`, `contextSummary`.
- Nodes (MVP): `InputGate` → `RetrieveNotes` (hybrid dense+BM25) → `CondenseContext` (dedupe/summarize) → `ComposePrompt` → `LLMGenerate` (stream) → `MemoryUpdate`.
- Fallbacks: if embeddings missing, run BM25-only; log advisory.

### E) Retrieval Strategy
- Chunk notes into 300–500 token segments; store `chunk_index`, `token_count`.
- Dense search: cosine topK=24 via `pgvector`.
- Sparse search: BM25 topK=24 via GIN full-text index.
- Merge by reciprocal rank fusion; cap to context budget with note diversity; attach citations.

### F) Data Model (Supabase additions)
- `threads(id uuid pk, user_id uuid, title text, created_at, updated_at)`
- `messages(id uuid pk, thread_id uuid, role text check ('user','assistant','system','tool'), content jsonb, token_count int, created_at)`
- `note_chunks(id uuid pk, note_id uuid, user_id uuid, chunk_index int, text text, token_count int, created_at, updated_at)`
- `note_embeddings(id uuid pk, chunk_id uuid, embedding vector(1536), model text, created_at)`
- Indexes:
  - `messages(thread_id, created_at desc)`
  - `threads(user_id, updated_at desc)`
  - `GIN (to_tsvector('english', note_chunks.text))`
  - `IVFFLAT` on `note_embeddings.embedding` (tune `lists`, `probes`)
- RLS: `user_id = auth.uid()` on all; service role only for background jobs.

### G) Security & Privacy
- Validate ownership on all thread/message operations.
- Store minimal metadata in `messages.content` (jsonb with `text`, `citations`).
- Rate-limit by `user_id` and `thread_id`.

### H) Observability
- Request ID per chat turn; log timing per stage (retrieval, prompt, LLM).
- Capture `retrieval_set` (chunk ids + scores) with assistant message.
- Minimal error reporting to client; detailed logs server-side.

### I) Performance Targets
- Time-to-first-token: ≤ 600ms (P50).
- Streaming starts as soon as prompt is ready.
- DB: monitor query plans; `ANALYZE` after index creation.

### J) Alignment to Repo
- API routes:
  - `app/api/chat/sessions/route.ts`
  - `app/api/chat/messages/route.ts`
- Orchestration:
  - `lib/llm/graph.ts`
  - `lib/llm/retrieval.ts`
  - `lib/llm/prompt.ts`
  - `lib/llm/embeddings.ts`
- Data Access:
  - `lib/chat.ts`
  - `lib/notes-index.ts`
  - reuse `lib/supabase.ts`
- UI:
  - `components/chat/ThreadList.tsx`
  - `components/chat/MessageList.tsx`
  - `components/chat/ChatInput.tsx`
  - `components/chat/Citations.tsx`
- Hooks:
  - `hooks/use-chat.ts` (stream + realtime)
  - reuse `hooks/use-session.ts`
- Background:
  - Supabase Edge Function `embed-notes`

### K) Acceptance Criteria
- Create a thread, send a message, and see streamed reply with ≥ 2 citations pointing to user notes.
- Realtime updates reflect new messages in the open thread without refresh.
- Updating a note propagates new chunks/embeddings within 60s and affects retrieval.
- RLS prevents cross-user access to threads and notes (verified with crafted requests).
- P50 time-to-first-token ≤ 600ms in staging with ≥ 1K note chunks/user.

## Non-Goals (MVP)
- Tooling beyond notes (e.g., web search, stock tools).
- Auto-summarization of entire threads beyond a simple rolling summary.
- Multi-user shared notes and permissions.
- Cross-encoder/LLM reranking.
- Analytics dashboards.

## Risks & Mitigations
- **Retrieval irrelevance**: Start with hybrid + diversity; add feedback and eval set.
- **Index drift after note edits**: Hash-based diff; re-embed only changed chunks.
- **Latency spikes**: Tune `IVFFLAT`, reduce topK, cache query embeddings briefly.
- **Cost spikes**: Small-dim embeddings; batch embedding; streaming reduces wasted tokens.
- **RLS misconfig**: Automated tests for RLS on each table.

## Launch Plan
- Staging behind feature flag; internal dogfood with seeded notes.
- Performance/regression tests; security review (RLS).
- Gradual rollout: 10% → 50% → 100%; monitor error/latency.

## Roadmap

### Phase 2: Quality & Memory
- Reranking: cross-encoder or smaller re-ranker on top 30.
- Rolling conversation summary persisted per `thread_id`.
- Materialized view for FT search; scheduled refresh.
- User feedback on answers (thumbs up/down with reasons).

### Phase 3: Tools & UX
- Action tools (summarize note, extract tasks, create new note from chat).
- Inline citation hover previews; highlight source spans.
- Thread rename via LLM title generation.
- Attach files to notes; OCR chunking pipeline.

### Phase 4: Scale & Governance
- Org/workspace model; shared notes with permissions.
- Offline evaluation suite and dashboard (precision@k, latency trends).
- Cost controls (daily token budgets, provider fallbacks).
- Multi-provider routing with health checks.

### Phase 5: Intelligence & Automation
- Planner node to choose domain tools (e.g., stocks) when intent detected.
- Proactive suggestions (related notes, follow-up questions).
- Continuous learning from feedback to adjust retrieval weights.

## Pseudocode Blueprint (for reference)
```text
onUserSendMessage(userId, threadId, text):
  assertAuth(userId)
  thread = ensureThread(userId, threadId)
  persistMessage(thread.id, role='user', content=text)

  parallel:
    queryEmbedding = embed(text)
    dense = annSearch(queryEmbedding, topK=24)
    sparse = bm25Search(text, topK=24)
    history = loadRecentOrSummary(thread.id)

  candidates = reciprocalRankFuse(dense, sparse)
  chunks = selectTopWithDiversity(candidates, maxContextTokens)
  contextSummary = summarizeChunks(chunks)

  prompt = composePrompt(system, history, contextSummary, citations)
  stream = llmStream(prompt)

  for token in stream:
    yield token to client

  persistAssistantMessage(thread.id, stream.fullText, citations)
  updateRollingSummary(thread.id, history + new exchange)
```

## Open Questions
- Embedding model choice and dimension (cost vs quality)?
- SSE vs `ReadableStream` preference for streaming in deployment?
- Maximum note size and expected average corpus per user?
- Retention for messages/threads (purge after N days?).


