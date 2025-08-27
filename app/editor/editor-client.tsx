'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface GrammarError {
  id: string
  originalText: string
  message: string
  suggestions: string[]
  type: 'grammar' | 'punctuation' | 'spelling'
  context?: string
  // Вычисляемые поля для позиций
  start?: number
  end?: number
}

interface StyleSuggestion {
  id: string
  originalText: string
  message: string
  suggestion: string
  type: 'clarity' | 'conciseness' | 'tone' | 'style'
  context?: string
  // Вычисляемые поля для позиций
  start?: number
  end?: number
}

interface Project {
  id: string
  title: string
  content: string
  description: string | null
  createdAt: string
  updatedAt: string
}

interface EditorClientProps {
  initialProject?: Project
}

export default function EditorClient({ initialProject }: EditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialProject?.title || 'Untitled Project')
  const [content, setContent] = useState(initialProject?.content || '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [wordCount, setWordCount] = useState(0)
  const [usageInfo, setUsageInfo] = useState<{
    grammarChecks: { used: number; limit: number; remaining: number }
    styleSuggestions: { used: number; limit: number; remaining: number }
    resetTime: Date
  } | null>(null)
  const [showLimitExceeded, setShowLimitExceeded] = useState(false)
  const [limitError, setLimitError] = useState<string>('')

  // Update word count
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    setWordCount(words)
  }, [content])

  // Load usage info on mount
  // Функция для получения информации об использовании
  const fetchUsageInfo = useCallback(async () => {
    try {
  // Load usage info on mount
  useEffect(() => {
    fetchUsageInfo()
  }, [fetchUsageInfo])
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageInfo(data)
      }
    } catch (error) {
      console.error('Error fetching usage info:', error)
    }
  }, [])

  // Функция для поиска точных позиций текста
  const findTextPositions = useCallback((originalText: string, searchText: string): { start: number; end: number } | null => {
    // Сначала попробуем точное совпадение
    const exactIndex = searchText.indexOf(originalText)
    if (exactIndex !== -1) {
      return {
        start: exactIndex,
        end: exactIndex + originalText.length
      }
    }
    
    // Попробуем найти с учетом различий в пробелах и знаках препинания
    const normalizeText = (text: string) => text.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').toLowerCase().trim()
    
    const normalizedSearch = normalizeText(searchText)
    const normalizedOriginal = normalizeText(originalText)
    
    if (normalizedOriginal.length === 0) return null
    
    const normalizedIndex = normalizedSearch.indexOf(normalizedOriginal)
    if (normalizedIndex === -1) return null
    
    // Найдем соответствующую позицию в оригинальном тексте
    let searchIndex = 0
    let normalizedCount = 0
    
    for (let i = 0; i < searchText.length; i++) {
      const char = searchText[i]
      const normalizedChar = normalizeText(char)
      
      if (normalizedChar.length > 0) {
        if (normalizedCount === normalizedIndex) {
          // Найдем конец совпадения
          let endSearchIndex = i
          let endNormalizedCount = normalizedCount
          
          while (endNormalizedCount < normalizedIndex + normalizedOriginal.length && endSearchIndex < searchText.length) {
            const endChar = searchText[endSearchIndex]
            const endNormalizedChar = normalizeText(endChar)
            
            if (endNormalizedChar.length > 0) {
              endNormalizedCount++
            }
            endSearchIndex++
          }
          
          return {
            start: i,
            end: endSearchIndex
          }
        }
        normalizedCount++
      }
    }
    
    return null
  }, [])

  const analyzeText = useCallback(async () => {
    if (!content.trim()) return

    setIsAnalyzing(true)
    try {
      // Grammar and punctuation check
      const grammarResponse = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })
      
      if (grammarResponse.ok) {
        const grammarData = await grammarResponse.json()
        // Вычисляем позиции для каждой ошибки
        const errorsWithPositions = (grammarData.errors || []).map((error: GrammarError) => {
          const positions = findTextPositions(error.originalText, content)
          return {
            ...error,
            start: positions?.start,
            end: positions?.end
          }
        }).filter((error: GrammarError) => error.start !== undefined && error.end !== undefined)
        
        setGrammarErrors(errorsWithPositions)
        console.log('Grammar errors found:', errorsWithPositions)
      }

      // Style suggestions
      const styleResponse = await fetch('/api/ai/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })
      
      if (styleResponse.ok) {
        const styleData = await styleResponse.json()
        // Вычисляем позиции для каждого предложения
        const suggestionsWithPositions = (styleData.suggestions || []).map((suggestion: StyleSuggestion) => {
          const positions = findTextPositions(suggestion.originalText, content)
          return {
            ...suggestion,
            start: positions?.start,
            end: positions?.end
          }
        }).filter((suggestion: StyleSuggestion) => suggestion.start !== undefined && suggestion.end !== undefined)
        
        setStyleSuggestions(suggestionsWithPositions)
        console.log('Style suggestions found:', suggestionsWithPositions)
      }
    } catch (error) {
      console.error('Error analyzing text:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [content])

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      if (initialProject) {
        // Update existing project
        const response = await fetch(`/api/projects/${initialProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save project')
        }
      } else {
        // Create new project
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        })
        
        if (!response.ok) {
          throw new Error('Failed to create project')
        }
        
        const newProject = await response.json()
        router.push(`/editor/${newProject.id}`)
      }
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const applySuggestion = (errorId: string, suggestion: string) => {
    const error = grammarErrors.find(e => e.id === errorId)
    if (error && error.start !== undefined && error.end !== undefined) {
      const newContent = content.substring(0, error.start) + 
                        suggestion + 
                        content.substring(error.end)
      setContent(newContent)
      setGrammarErrors(prev => prev.filter(e => e.id !== errorId))
      // Также очистим стилистические предложения, так как текст изменился
      setStyleSuggestions([])
    }
  }

  const renderTextWithHighlights = () => {
    if (!showSuggestions || (!grammarErrors.length && !styleSuggestions.length)) {
      return content
    }

    const allIssues = [
      ...grammarErrors.filter(e => e.start !== undefined && e.end !== undefined).map(e => ({ ...e, category: 'grammar' as const })),
      ...styleSuggestions.filter(s => s.start !== undefined && s.end !== undefined).map(s => ({ ...s, category: 'style' as const }))
    ].sort((a, b) => (a.start || 0) - (b.start || 0))

    let result = []
    let lastIndex = 0

    allIssues.forEach((issue, index) => {
      const start = issue.start || 0
      const end = issue.end || 0
      
      // Add text before the issue
      if (start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {content.substring(lastIndex, start)}
          </span>
        )
      }

      // Add highlighted text with popover
      const issueText = content.substring(start, end)
      const isGrammar = issue.category === 'grammar'
      
      result.push(
        <Popover key={`issue-${issue.id}`}>
          <PopoverTrigger asChild>
            <span
              className={`cursor-pointer rounded-sm px-0.5 ${
                isGrammar 
                  ? 'bg-red-100 text-red-800 underline decoration-red-500 decoration-wavy' 
                  : 'bg-blue-100 text-blue-800 underline decoration-blue-500 decoration-wavy'
              }`}
            >
              {issueText}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-w-[500px]">
            <div className="space-y-4 p-1">
              <div className="flex items-start space-x-3">
                {isGrammar ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-1">
                    {isGrammar ? 'Grammar Issue' : 'Style Suggestion'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {issue.message}
                  </p>
                  {issue.context && (
                    <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Context:</span> {issue.context}
                    </div>
                  )}
                </div>
              </div>
              
              {isGrammar && 'suggestions' in issue && issue.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Suggestions:</p>
                  {issue.suggestions.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-3 px-3 text-sm leading-relaxed hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => applySuggestion(issue.id, suggestion)}
                    >
                      <span className="break-words text-left whitespace-normal">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              )}
              
              {!isGrammar && 'suggestion' in issue && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Suggestion:</p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm leading-relaxed break-words">
                    {issue.suggestion}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )

      lastIndex = end
    })

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      )
    }

    return result
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">InkPilot</span>
              </div>
              <Badge variant="secondary">Editor</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500">
                {wordCount} words
              </div>
              <Button onClick={handleSave} variant="outline" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Editor */}
            <div className="lg:col-span-3 space-y-4">
              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-0 px-0 py-2 focus-visible:ring-0"
                placeholder="Enter project title..."
              />
              
              <Separator />

              {/* Content */}
              <div className="relative">
                {showSuggestions ? (
                  <div className="min-h-96 p-4 border rounded-lg bg-white dark:bg-slate-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {renderTextWithHighlights()}
                  </div>
                ) : (
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-96 resize-none font-mono text-sm"
                    placeholder="Start writing your content here..."
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={analyzeText}
                    disabled={isAnalyzing || !content.trim()}
                    variant="default"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Analyze Text
                  </Button>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        variant="outline"
                        size="sm"
                      >
                        {showSuggestions ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="text-sm text-slate-500">
                  {grammarErrors.length > 0 && (
                    <span className="text-red-600 mr-4">
                      {grammarErrors.length} grammar issues
                    </span>
                  )}
                  {styleSuggestions.length > 0 && (
                    <span className="text-blue-600">
                      {styleSuggestions.length} style suggestions
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Stats */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Document Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Words:</span>
                    <span>{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paragraphs:</span>
                    <span>{content.split('\n\n').filter(p => p.trim()).length}</span>
                  </div>
                </div>
              </Card>

              {/* Issues Summary */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Writing Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Grammar</span>
                    </div>
                    <Badge variant={grammarErrors.length > 0 ? "destructive" : "default"}>
                      {grammarErrors.length}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Style</span>
                    </div>
                    <Badge variant={styleSuggestions.length > 0 ? "secondary" : "default"}>
                      {styleSuggestions.length}
                    </Badge>
                  </div>
                  
                  {grammarErrors.length === 0 && styleSuggestions.length === 0 && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">All good!</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Tips */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Writing Tips</h3>
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                  <p>• Use the Analyze button to check your text</p>
                  <p>• Click highlighted text to see suggestions</p>
                  <p>• Toggle the eye icon to hide/show highlights</p>
                  <p>• Save your work frequently</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
