import React from 'react'
import { cn } from './utils'

/**
 * Markdown parsing and rendering utilities for AI responses
 * Converts common markdown syntax to styled React components
 */

interface MarkdownElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'list-item' | 'blockquote' | 'line-break'
  content: string
  level?: number
  href?: string
  listType?: 'bullet' | 'numbered'
  listNumber?: string
}

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  className?: string
}

interface MarkdownTextProps {
  children: string
  className?: string
}

/**
 * Code block component with syntax highlighting placeholder
 */
const CodeBlock: React.FC<CodeBlockProps> = ({ children, language, className }) => (
  <pre className={cn(
    "bg-muted border rounded-md p-3 text-sm font-mono overflow-x-auto my-2",
    "dark:bg-muted/50",
    className
  )}>
    <code className={language ? `language-${language}` : undefined}>
      {children}
    </code>
  </pre>
)

/**
 * Inline code component
 */
const InlineCode: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <code className={cn(
    "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
    "dark:bg-muted/70",
    className
  )}>
    {children}
  </code>
)

/**
 * Parse markdown text into structured elements
 */
function parseMarkdown(text: string): MarkdownElement[] {
  const elements: MarkdownElement[] = []
  const lines = text.split('\n')
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    
    // Handle code blocks (```code```)
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++ // Skip opening ```
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      
      elements.push({
        type: 'code',
        content: codeLines.join('\n')
      })
      i++ // Skip closing ```
      continue
    }
    
    // Handle headings (# ## ###)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      elements.push({
        type: 'heading',
        content: headingMatch[2],
        level: headingMatch[1].length
      })
      i++
      continue
    }
    
    // Handle blockquotes (> text)
    if (line.trim().startsWith('> ')) {
      elements.push({
        type: 'blockquote',
        content: line.replace(/^>\s*/, '')
      })
      i++
      continue
    }
    
    // Handle list items (- or * or numbers)
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/)
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/)
    
    if (bulletMatch) {
      elements.push({
        type: 'list-item',
        content: bulletMatch[1],
        listType: 'bullet'
      })
      i++
      continue
    }
    
    if (numberedMatch) {
      elements.push({
        type: 'list-item',
        content: numberedMatch[2],
        listType: 'numbered',
        listNumber: numberedMatch[1]
      })
      i++
      continue
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      elements.push({
        type: 'line-break',
        content: ''
      })
      i++
      continue
    }
    
    // Handle regular text with inline formatting
    if (line.trim()) {
      elements.push({
        type: 'text',
        content: line
      })
    }
    
    i++
  }
  
  return elements
}

/**
 * Parse inline markdown formatting (bold, italic, links, inline code)
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  
  // Regex patterns for inline formatting
  const patterns = [
    { type: 'code', regex: /`([^`]+)`/g },
    { type: 'bold', regex: /\*\*([^*]+)\*\*/g },
    { type: 'italic', regex: /\*([^*]+)\*/g },
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g }
  ]
  
  // Find all matches and their positions
  const matches: Array<{
    type: string
    match: RegExpMatchArray
    start: number
    end: number
  }> = []
  
  patterns.forEach(pattern => {
    let match
    pattern.regex.lastIndex = 0 // Reset regex
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        type: pattern.type,
        match,
        start: match.index!,
        end: match.index! + match[0].length
      })
    }
  })
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start)
  
  // Process matches and build React nodes
  matches.forEach((matchInfo, index) => {
    const { type, match, start, end } = matchInfo
    
    // Add text before this match
    if (start > currentIndex) {
      parts.push(text.slice(currentIndex, start))
    }
    
    // Add the formatted element
    const key = `${type}-${index}`
    switch (type) {
      case 'bold':
        parts.push(<strong key={key} className="font-semibold">{match[1]}</strong>)
        break
      case 'italic':
        parts.push(<em key={key} className="italic">{match[1]}</em>)
        break
      case 'code':
        parts.push(<InlineCode key={key}>{match[1]}</InlineCode>)
        break
      case 'link':
        parts.push(
          <a 
            key={key} 
            href={match[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {match[1]}
          </a>
        )
        break
    }
    
    currentIndex = end
  })
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex))
  }
  
  // If no formatting was found, return the original text
  return parts.length === 0 ? [text] : parts
}

/**
 * Heading component that handles different levels
 */
const MarkdownHeading: React.FC<{ level: number; children: React.ReactNode; className?: string }> = ({ 
  level, 
  children, 
  className 
}) => {
  const headingClassName = cn(
    "font-semibold leading-tight",
    level === 1 && "text-lg",
    level === 2 && "text-base", 
    level === 3 && "text-sm font-medium",
    level >= 4 && "text-sm",
    className
  )

  switch (level) {
    case 1:
      return <h1 className={headingClassName}>{children}</h1>
    case 2:
      return <h2 className={headingClassName}>{children}</h2>
    case 3:
      return <h3 className={headingClassName}>{children}</h3>
    case 4:
      return <h4 className={headingClassName}>{children}</h4>
    case 5:
      return <h5 className={headingClassName}>{children}</h5>
    case 6:
      return <h6 className={headingClassName}>{children}</h6>
    default:
      return <h2 className={headingClassName}>{children}</h2>
  }
}

/**
 * Main component for rendering markdown text as React components
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ children, className }) => {
  const elements = parseMarkdown(children)
  
  return (
    <div className={cn("space-y-2", className)}>
      {elements.map((element, index) => {
        const key = `element-${index}`
        
        switch (element.type) {
          case 'heading':
            return (
              <MarkdownHeading 
                key={key}
                level={element.level || 2}
              >
                {parseInlineFormatting(element.content)}
              </MarkdownHeading>
            )
            
          case 'code':
            return (
              <CodeBlock key={key}>
                {element.content}
              </CodeBlock>
            )
            
          case 'blockquote':
            return (
              <blockquote 
                key={key}
                className="border-l-4 border-muted-foreground/30 pl-3 italic text-muted-foreground"
              >
                {parseInlineFormatting(element.content)}
              </blockquote>
            )
            
          case 'list-item':
            return (
              <div key={key} className="flex items-start gap-2">
                {element.listType === 'bullet' && (
                  <span className="text-muted-foreground mt-0.5">•</span>
                )}
                {element.listType === 'numbered' && (
                  <span className="text-muted-foreground mt-0.5 min-w-[1.5rem]">
                    {element.listNumber}.
                  </span>
                )}
                <span className="flex-1">
                  {parseInlineFormatting(element.content)}
                </span>
              </div>
            )
            
          case 'line-break':
            return <div key={key} className="h-2" />
            
          case 'text':
          default:
            return (
              <p key={key} className="leading-relaxed">
                {parseInlineFormatting(element.content)}
              </p>
            )
        }
      })}
    </div>
  )
}

/**
 * Utility function for simple markdown conversion
 * @param text - Markdown text to convert
 * @returns JSX element with formatted content
 */
export function convertMarkdownToJSX(text: string): React.ReactElement {
  return <MarkdownText>{text}</MarkdownText>
}

/**
 * Hook for processing markdown content
 * @param content - Markdown content string
 * @returns Processed JSX content
 */
export function useMarkdown(content: string): React.ReactElement {
  return React.useMemo(() => convertMarkdownToJSX(content), [content])
} 