"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share, Edit, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "../../components/ui/alert"

// Demo types for the static data
interface DemoAuthor {
  name: string
  email: string
}

interface DemoPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: DemoAuthor
  created_at: string
  tags: string[]
  likes_count: number
  comments_count: number
  user_has_liked: boolean
  published: boolean
}

interface DemoComment {
  id: string
  post_id: string
  content: string
  author: DemoAuthor
  created_at: string
  replies: DemoComment[]
}

export default function PostsPage() {
  const { user } = useAuth()

  // Demo data
  const demoPosts = [
    {
      id: "1",
      title: "Understanding Tesla's Recent Stock Performance: A Technical Analysis",
      excerpt: "Deep dive into TSLA's price movements, key support and resistance levels, and what institutional investors are watching.",
      content: "Tesla's stock has shown significant volatility in recent quarters, with key technical indicators suggesting...",
      author: {
        name: "Sarah Chen",
        email: "sarah.chen@example.com"
      },
      created_at: "2024-01-15T10:30:00Z",
      tags: ["TSLA", "Technical Analysis", "EV Sector"],
      likes_count: 34,
      comments_count: 12,
      user_has_liked: false,
      published: true
    },
    {
      id: "2", 
      title: "Federal Reserve Policy Impact on Tech Stock Valuations",
      excerpt: "How interest rate decisions and monetary policy changes are reshaping the technology sector's investment landscape.",
      content: "The Federal Reserve's recent policy decisions have created ripple effects across technology stocks...",
      author: {
        name: "Michael Rodriguez",
        email: "michael.r@example.com"
      },
      created_at: "2024-01-14T14:20:00Z",
      tags: ["Fed Policy", "Tech Stocks", "Interest Rates"],
      likes_count: 67,
      comments_count: 23,
      user_has_liked: true,
      published: true
    },
    {
      id: "3",
      title: "AI Sector Rotation: Which Stocks Are Positioned for Growth",
      excerpt: "Analyzing the current AI investment landscape and identifying companies with sustainable competitive advantages.",
      content: "The artificial intelligence sector continues to evolve rapidly, with several key players emerging as leaders...",
      author: {
        name: "David Kim",
        email: "david.kim@example.com"
      },
      created_at: "2024-01-13T09:15:00Z",
      tags: ["AI Stocks", "Growth Investing", "NVDA", "MSFT"],
      likes_count: 45,
      comments_count: 18,
      user_has_liked: false,
      published: true
    },
    {
      id: "4",
      title: "Dividend Aristocrats: Building a Reliable Income Portfolio",
      excerpt: "Exploring S&P 500 companies with 25+ years of consecutive dividend increases and their role in portfolio construction.",
      content: "Dividend aristocrats represent some of the most reliable income-generating investments in the market...",
      author: {
        name: "Jennifer Walsh",
        email: "j.walsh@example.com"
      },
      created_at: "2024-01-12T16:45:00Z",
      tags: ["Dividend Stocks", "Income Investing", "S&P 500"],
      likes_count: 29,
      comments_count: 8,
      user_has_liked: true,
      published: true
    }
  ]

  const demoComments = [
    {
      id: "1",
      post_id: "1",
      content: "Great analysis on TSLA! The chart patterns you highlighted are particularly insightful for my trading strategy.",
      author: { name: "Alex Thompson", email: "alex.t@example.com" },
      created_at: "2024-01-15T11:00:00Z",
      replies: []
    },
    {
      id: "2",
      post_id: "1", 
      content: "Thanks for the technical breakdown. Do you think the $180 support level will hold if we see broader market weakness?",
      author: { name: "Maria Santos", email: "maria.s@example.com" },
      created_at: "2024-01-15T12:30:00Z",
      replies: [
        {
          id: "3",
          post_id: "1",
          content: "Based on the volume profile, I think $175 is more realistic support. The institutional buying seems lighter around $180.",
          author: { name: "Robert Chang", email: "robert.c@example.com" },
          created_at: "2024-01-15T13:15:00Z",
          replies: []
        }
      ]
    },
    {
      id: "4",
      post_id: "2",
      content: "Excellent point about Fed policy impact. The correlation between rate expectations and tech multiples has been fascinating to track.",
      author: { name: "Lisa Park", email: "lisa.p@example.com" },
      created_at: "2024-01-14T15:45:00Z",
      replies: []
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const PostCard = ({ post }: { post: DemoPost }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-4 mb-2">
          <Avatar>
            <AvatarFallback>
              {post.author.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
          </div>
        </div>
        <CardTitle className="text-xl">{post.title}</CardTitle>
        <CardDescription>{post.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-1 ${post.user_has_liked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${post.user_has_liked ? 'fill-current' : ''}`} />
              <span>{post.likes_count}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          </div>
          {user && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const CommentItem = ({ comment, isReply = false }: { comment: DemoComment, isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <div className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author.name.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-sm font-medium">{comment.author.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
          <Button variant="ghost" size="sm" className="text-xs">
            Reply
          </Button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply: DemoComment) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* WIP Notice */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Work in Progress:</strong> This is a demo of the upcoming Posts feature. 
          The functionality shown here is not yet implemented and serves as a preview of planned features.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Stock Analysis & Market Insights</h1>
          <p className="text-muted-foreground mt-2">
            Share market analysis, trading strategies, and investment insights with the community
          </p>
        </div>
        {user && (
          <Button>
            Create New Analysis
          </Button>
        )}
      </div>

      {/* Filter/Search Bar */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer">All Posts</Badge>
          <Badge variant="outline" className="cursor-pointer">Technical Analysis</Badge>
          <Badge variant="outline" className="cursor-pointer">AI Stocks</Badge>
          <Badge variant="outline" className="cursor-pointer">Dividend Stocks</Badge>
          <Badge variant="outline" className="cursor-pointer">Fed Policy</Badge>
          <Badge variant="outline" className="cursor-pointer">EV Sector</Badge>
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {demoPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoComments.slice(0, 3).map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">TSLA</Badge>
                <Badge variant="secondary">NVDA</Badge>
                <Badge variant="secondary">MSFT</Badge>
                <Badge variant="secondary">Technical Analysis</Badge>
                <Badge variant="secondary">AI Stocks</Badge>
                <Badge variant="secondary">Fed Policy</Badge>
                <Badge variant="secondary">Dividend Stocks</Badge>
                <Badge variant="secondary">EV Sector</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Analyses</span>
                  <span className="font-medium">284</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Analysts</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Comments</span>
                  <span className="font-medium">1,023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Likes</span>
                  <span className="font-medium">2,156</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 