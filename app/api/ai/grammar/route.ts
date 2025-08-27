import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import { checkAndUpdateUsage } from '@/lib/usage'
import { prisma } from '@/lib/prisma'

const GrammarErrorSchema = z.object({
  errors: z.array(z.object({
    id: z.string(),
    originalText: z.string(),
    message: z.string(),
    suggestions: z.array(z.string()),
    type: z.enum(['grammar', 'punctuation', 'spelling']),
    context: z.string().optional()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check usage limits
    const usage = await checkAndUpdateUsage(user.id, 'grammar')
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
      schema: GrammarErrorSchema,
      prompt: `
        Analyze the following text for grammar, punctuation, and spelling errors. 
        For each error found, provide:
        - A unique ID (use format: error_1, error_2, etc.)
        - The EXACT original text that contains the error (copy it precisely from the source)
        - A clear explanation of the error
        - 1-3 correction suggestions
        - The type of error (grammar, punctuation, or spelling)
        - Context: a few words before and after the error for better identification

        IMPORTANT: 
        - Copy the originalText EXACTLY as it appears in the source text
        - Include only the problematic part, not the whole sentence
        - Be precise with the text extraction
        - Only include actual errors, not stylistic suggestions
        
        Text to analyze:
        "${text}"
      `,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Grammar analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze grammar' },
      { status: 500 }
    )
  }
}
