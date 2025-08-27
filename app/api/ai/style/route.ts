import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { checkAndUpdateUsage } from '@/lib/usage'
import { prisma } from '@/lib/prisma'

const StyleSuggestionSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    originalText: z.string(),
    message: z.string(),
    suggestion: z.string(),
    type: z.enum(['clarity', 'conciseness', 'tone', 'style']),
    context: z.string().optional()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '',
          name: null,
        }
      })
    }

    // Check usage limits
    const usage = await checkAndUpdateUsage(user.id, 'style')
    if (!usage.allowed) {
      return NextResponse.json({
        error: 'Daily limit exceeded',
        limit: usage.limit,
        resetTime: usage.resetTime,
        upgradeUrl: '/pricing'
      }, { status: 429 })
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: StyleSuggestionSchema,
      prompt: `
        Analyze the following text for style improvements. Focus on:
        - Clarity: Making sentences clearer and easier to understand
        - Conciseness: Removing unnecessary words or phrases
        - Tone: Ensuring appropriate tone for the content
        - Style: Improving flow, readability, and engagement

        For each suggestion, provide:
        - A unique ID (use format: style_1, style_2, etc.)
        - The EXACT original text that needs improvement (copy it precisely from the source)
        - A clear explanation of the issue
        - A specific suggestion for improvement
        - The type of improvement (clarity, conciseness, tone, or style)
        - Context: a few words before and after for better identification

        IMPORTANT: 
        - Copy the originalText EXACTLY as it appears in the source text
        - Include the full phrase or sentence that needs improvement
        - Be precise with the text extraction
        - Only suggest meaningful improvements that would genuinely enhance the writing
        - Avoid nitpicking or overly minor suggestions
        
        Text to analyze:
        "${text}"
      `,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Style analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze style' },
      { status: 500 }
    )
  }
}
