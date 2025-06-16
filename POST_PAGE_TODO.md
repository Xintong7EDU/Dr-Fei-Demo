# Post Page Implementation TODO

## Overview
Implement a comprehensive news post system where authorized users can create posts, and all users can like and comment on posts. This follows the existing architecture patterns in the project using Next.js, Supabase, TypeScript, and React Context.

## 🗄️ Database Schema Extensions

### 1. Create Posts Table
```sql
CREATE TABLE IF NOT EXISTS posts (
  post_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  slug text UNIQUE NOT NULL,
  published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tags text[],
  featured_image_url text,
  excerpt text
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
```

### 2. Create Comments Table
```sql
CREATE TABLE IF NOT EXISTS comments (
  comment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(post_id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES comments(comment_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
```

### 3. Create Likes Table
```sql
CREATE TABLE IF NOT EXISTS likes (
  like_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(post_id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_post ON likes(post_id);
```

### 4. Create User Roles Table (For Authorization)
```sql
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'author', 'reader')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_user_roles_role ON user_roles(role);
```

### 5. Row Level Security (RLS) Policies
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (published = true OR auth.uid() = author_id);
CREATE POLICY "Authors can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "User roles are viewable by the user themselves" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can manage user roles" ON user_roles FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
```

## 📁 Type Definitions

### 1. Create `types/post.ts`
```typescript
export interface Post {
  post_id: string
  author_id: string
  title: string
  content: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
  tags?: string[]
  featured_image_url?: string
  excerpt?: string
  author?: {
    id: string
    email: string
    // Add more user fields as needed
  }
  likes_count?: number
  comments_count?: number
  user_has_liked?: boolean
}

export interface Comment {
  comment_id: string
  post_id: string
  author_id: string
  content: string
  parent_comment_id?: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    email: string
  }
  replies?: Comment[]
}

export interface Like {
  like_id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface UserRole {
  user_id: string
  role: 'admin' | 'author' | 'reader'
  created_at: string
  updated_at: string
}

export interface CreatePostData {
  title: string
  content: string
  slug: string
  published?: boolean
  tags?: string[]
  featured_image_url?: string
  excerpt?: string
}

export interface UpdatePostData extends Partial<CreatePostData> {
  post_id: string
}

export interface CreateCommentData {
  post_id: string
  content: string
  parent_comment_id?: string
}
```

## 🔧 Utility Functions

### 1. Create `lib/posts.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Post, CreatePostData, UpdatePostData } from '@/types/post'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getUserRole(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) return 'reader'
  return data.role
}

export async function canUserCreatePosts(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return ['admin', 'author'].includes(role)
}

export async function createPost(postData: CreatePostData, authorId: string): Promise<{ data: Post | null; error: Error | null }> {
  // Implementation here
}

export async function updatePost(postData: UpdatePostData): Promise<{ data: Post | null; error: Error | null }> {
  // Implementation here
}

export async function deletePost(postId: string): Promise<{ error: Error | null }> {
  // Implementation here
}

export async function getPostBySlug(slug: string): Promise<{ data: Post | null; error: Error | null }> {
  // Implementation here
}

export async function getPosts(options?: {
  published?: boolean
  authorId?: string
  limit?: number
  offset?: number
}): Promise<{ data: Post[] | null; error: Error | null }> {
  // Implementation here
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
```

### 2. Create `lib/comments.ts`
```typescript
// Similar structure for comment operations
export async function createComment(commentData: CreateCommentData, authorId: string): Promise<{ data: Comment | null; error: Error | null }>
export async function getCommentsByPost(postId: string): Promise<{ data: Comment[] | null; error: Error | null }>
export async function updateComment(commentId: string, content: string): Promise<{ data: Comment | null; error: Error | null }>
export async function deleteComment(commentId: string): Promise<{ error: Error | null }>
```

### 3. Create `lib/likes.ts`
```typescript
// Similar structure for like operations
export async function toggleLike(postId: string, userId: string): Promise<{ data: { liked: boolean; count: number } | null; error: Error | null }>
export async function getLikesCount(postId: string): Promise<number>
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean>
```

## 🧩 React Components

### 1. Post List Components
- [ ] `components/posts/PostList.tsx` - Display list of posts with pagination
- [ ] `components/posts/PostCard.tsx` - Individual post card component
- [ ] `components/posts/PostFilters.tsx` - Filter posts by tags, author, date
- [ ] `components/posts/PostSearch.tsx` - Search functionality

### 2. Post Detail Components
- [ ] `components/posts/PostDetail.tsx` - Full post view with content
- [ ] `components/posts/PostHeader.tsx` - Post title, author, date, tags
- [ ] `components/posts/PostContent.tsx` - Post content with proper formatting
- [ ] `components/posts/PostActions.tsx` - Like, share, edit buttons

### 3. Post Creation/Editing Components
- [ ] `components/posts/PostEditor.tsx` - Rich text editor for creating/editing posts
- [ ] `components/posts/PostForm.tsx` - Form wrapper with validation
- [ ] `components/posts/TagInput.tsx` - Tag selection/creation component
- [ ] `components/posts/ImageUpload.tsx` - Featured image upload component
- [ ] `components/posts/PostPreview.tsx` - Preview post before publishing

### 4. Comment Components
- [ ] `components/comments/CommentSection.tsx` - Main comment container
- [ ] `components/comments/CommentList.tsx` - List of comments with nesting
- [ ] `components/comments/CommentItem.tsx` - Individual comment component
- [ ] `components/comments/CommentForm.tsx` - Form for creating/editing comments
- [ ] `components/comments/CommentActions.tsx` - Reply, edit, delete buttons

### 5. Like Components
- [ ] `components/likes/LikeButton.tsx` - Like/unlike toggle button
- [ ] `components/likes/LikeCount.tsx` - Display like count

### 6. Authorization Components
- [ ] `components/auth/AuthorizeAction.tsx` - HOC for role-based access
- [ ] `components/auth/RoleGate.tsx` - Component to show/hide based on role

## 📄 Pages and Routes

### 1. Post Pages
- [ ] `app/posts/page.tsx` - Post listing page
- [ ] `app/posts/[slug]/page.tsx` - Individual post view
- [ ] `app/posts/create/page.tsx` - Create new post (authorized users only)
- [ ] `app/posts/[slug]/edit/page.tsx` - Edit post (author only)

### 2. API Routes
- [ ] `app/api/posts/route.ts` - GET (list), POST (create)
- [ ] `app/api/posts/[id]/route.ts` - GET (detail), PUT (update), DELETE
- [ ] `app/api/posts/[id]/comments/route.ts` - GET, POST comments
- [ ] `app/api/posts/[id]/likes/route.ts` - POST, DELETE likes
- [ ] `app/api/comments/[id]/route.ts` - PUT, DELETE specific comment

## 🎨 UI Components (using existing shadcn/ui pattern)

### 1. New UI Components Needed
- [ ] Rich Text Editor wrapper (consider TipTap or similar)
- [ ] Tag Input component
- [ ] File Upload component
- [ ] Pagination component
- [ ] Search Input component
- [ ] Share Button component

### 2. Extend Existing Components
- [ ] Update `Button` variants for post actions
- [ ] Create new `Card` variants for posts
- [ ] Add `Badge` variants for tags
- [ ] Extend `Avatar` for comment authors

## 🔌 Hooks

### 1. Post Hooks
- [ ] `hooks/usePosts.tsx` - Fetch and manage posts
- [ ] `hooks/usePost.tsx` - Fetch single post
- [ ] `hooks/useCreatePost.tsx` - Handle post creation
- [ ] `hooks/useUpdatePost.tsx` - Handle post updates
- [ ] `hooks/useDeletePost.tsx` - Handle post deletion

### 2. Comment Hooks
- [ ] `hooks/useComments.tsx` - Fetch and manage comments
- [ ] `hooks/useCreateComment.tsx` - Handle comment creation
- [ ] `hooks/useUpdateComment.tsx` - Handle comment updates

### 3. Like Hooks
- [ ] `hooks/useLikes.tsx` - Handle like/unlike actions
- [ ] `hooks/useLikeStatus.tsx` - Track like status for posts

### 4. Authorization Hooks
- [ ] `hooks/useUserRole.tsx` - Get current user's role
- [ ] `hooks/useAuthorization.tsx` - Check permissions for actions

## 🔐 Security Considerations

### 1. Input Validation
- [ ] Sanitize HTML content in posts and comments
- [ ] Validate post slugs for uniqueness
- [ ] Rate limiting for post creation and comments
- [ ] Content length limits

### 2. Authorization Checks
- [ ] Server-side role verification for all protected actions
- [ ] Client-side UI hiding based on permissions
- [ ] API route protection with middleware

### 3. Content Moderation
- [ ] Flag inappropriate content system
- [ ] Admin moderation interface
- [ ] Soft delete for posts and comments

## 🧪 Testing Strategy

### 1. Unit Tests
- [ ] Test utility functions (posts, comments, likes)
- [ ] Test custom hooks
- [ ] Test authorization logic

### 2. Component Tests
- [ ] Test post creation form
- [ ] Test comment functionality
- [ ] Test like interactions
- [ ] Test role-based component rendering

### 3. Integration Tests
- [ ] Test complete post creation flow
- [ ] Test comment and reply flow
- [ ] Test like/unlike flow
- [ ] Test authorization scenarios

## 🎯 Implementation Priority

### Phase 1: Core Foundation
1. Database schema and migrations
2. Type definitions
3. Basic utility functions
4. User role system

### Phase 2: Basic Post System
1. Post creation and editing
2. Post listing and detail views
3. Basic authorization checks
4. Post management API routes

### Phase 3: Interaction Features
1. Like system
2. Comment system
3. Nested comments
4. Real-time updates

### Phase 4: Enhanced Features
1. Rich text editing
2. Image uploads
3. Advanced search and filtering
4. Content moderation

### Phase 5: Polish and Optimization
1. Performance optimizations
2. SEO improvements
3. Accessibility enhancements
4. Mobile responsiveness

## 📈 Performance Considerations

### 1. Database Optimization
- [ ] Proper indexing for queries
- [ ] Pagination for large datasets
- [ ] Query optimization for complex joins

### 2. Frontend Optimization
- [ ] Lazy loading for images
- [ ] Virtual scrolling for large comment threads
- [ ] Optimistic updates for likes
- [ ] Debounced search inputs

### 3. Caching Strategy
- [ ] Cache popular posts
- [ ] Cache user roles
- [ ] Implement proper cache invalidation

## 🔄 Real-time Features (Future Enhancement)

### 1. Live Updates
- [ ] Real-time like counts
- [ ] Live comment updates
- [ ] Notification system for new posts

### 2. Collaborative Features
- [ ] Live comment indicators
- [ ] User presence indicators
- [ ] Real-time post editing conflicts

## 📱 Mobile Considerations

### 1. Responsive Design
- [ ] Mobile-optimized post editor
- [ ] Touch-friendly like buttons
- [ ] Swipe gestures for post navigation

### 2. Performance
- [ ] Lazy loading for mobile
- [ ] Reduced bundle size
- [ ] Progressive Web App features

## 🔍 SEO and Accessibility

### 1. SEO
- [ ] Meta tags for posts
- [ ] Open Graph images
- [ ] Structured data markup
- [ ] XML sitemap for posts

### 2. Accessibility
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] High contrast mode support

---

## 🚀 Getting Started

1. **Setup Database**: Run the SQL migrations to create necessary tables
2. **Create Types**: Implement the TypeScript interfaces
3. **Build Core Functions**: Start with basic CRUD operations
4. **Create Components**: Build reusable UI components
5. **Implement Pages**: Create the main post pages
6. **Add Interactions**: Implement likes and comments
7. **Test and Polish**: Add tests and optimize performance

This implementation will provide a robust, scalable news post system that follows the existing project patterns and coding standards. 