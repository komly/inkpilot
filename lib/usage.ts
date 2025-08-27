import { prisma } from './prisma'

const FREE_DAILY_LIMITS = {
  grammarChecks: 10,
  styleSuggestions: 10
}

export async function checkAndUpdateUsage(userId: string, type: 'grammar' | 'style'): Promise<{
  allowed: boolean
  remaining: number
  limit: number
  resetTime: Date
}> {
  // Get or create user usage record
  let usage = await prisma.userUsage.findUnique({
    where: { userId }
  })

  if (!usage) {
    usage = await prisma.userUsage.create({
      data: {
        userId,
        planType: 'free'
      }
    })
  }

  // Check if we need to reset daily counters
  const now = new Date()
  const lastReset = new Date(usage.lastResetDate)
  const isNewDay = now.getDate() !== lastReset.getDate() || 
                   now.getMonth() !== lastReset.getMonth() || 
                   now.getFullYear() !== lastReset.getFullYear()

  if (isNewDay) {
    // Reset daily counters
    usage = await prisma.userUsage.update({
      where: { userId },
      data: {
        grammarChecksToday: 0,
        styleSuggestionsToday: 0,
        lastResetDate: now
      }
    })
  }

  // Check limits based on plan type
  if (usage.planType === 'free') {
    const currentCount = type === 'grammar' ? usage.grammarChecksToday : usage.styleSuggestionsToday
    const limit = type === 'grammar' ? FREE_DAILY_LIMITS.grammarChecks : FREE_DAILY_LIMITS.styleSuggestions
    
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        resetTime: new Date(usage.lastResetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    }

    // Update usage count
    await prisma.userUsage.update({
      where: { userId },
      data: type === 'grammar' 
        ? { grammarChecksToday: { increment: 1 } }
        : { styleSuggestionsToday: { increment: 1 } }
    })

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      limit,
      resetTime: new Date(usage.lastResetDate.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  // Pro/Enterprise plans have unlimited usage
  return {
    allowed: true,
    remaining: -1, // Unlimited
    limit: -1,
    resetTime: new Date(usage.lastResetDate.getTime() + 24 * 60 * 60 * 1000)
  }
}

export async function getUserUsage(userId: string) {
  let usage = await prisma.userUsage.findUnique({
    where: { userId }
  })

  if (!usage) {
    usage = await prisma.userUsage.create({
      data: {
        userId,
        planType: 'free'
      }
    })
  }

  const now = new Date()
  const lastReset = new Date(usage.lastResetDate)
  const isNewDay = now.getDate() !== lastReset.getDate() || 
                   now.getMonth() !== lastReset.getMonth() || 
                   now.getFullYear() !== lastReset.getFullYear()

  if (isNewDay) {
    return {
      planType: usage.planType,
      grammarChecks: {
        used: 0,
        limit: usage.planType === 'free' ? FREE_DAILY_LIMITS.grammarChecks : -1,
        remaining: usage.planType === 'free' ? FREE_DAILY_LIMITS.grammarChecks : -1,
      },
      styleSuggestions: {
        used: 0,
        limit: usage.planType === 'free' ? FREE_DAILY_LIMITS.styleSuggestions : -1,
        remaining: usage.planType === 'free' ? FREE_DAILY_LIMITS.styleSuggestions : -1,
      },
      resetTime: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  return {
    planType: usage.planType,
    grammarChecks: {
      used: usage.grammarChecksToday,
      limit: usage.planType === 'free' ? FREE_DAILY_LIMITS.grammarChecks : -1,
      remaining: usage.planType === 'free' ? (FREE_DAILY_LIMITS.grammarChecks - usage.grammarChecksToday) : -1,
    },
    styleSuggestions: {
      used: usage.styleSuggestionsToday,
      limit: usage.planType === 'free' ? FREE_DAILY_LIMITS.styleSuggestions : -1,
      remaining: usage.planType === 'free' ? (FREE_DAILY_LIMITS.styleSuggestions - usage.styleSuggestionsToday) : -1 
    },
    resetTime: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000)
  }
}
