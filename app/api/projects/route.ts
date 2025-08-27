import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
      const { emailAddresses, firstName, lastName } = await auth()
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: emailAddresses?.[0]?.emailAddress || '',
          name: firstName && lastName ? `${firstName} ${lastName}` : null,
        }
      })
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, description } = await req.json()

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      const { emailAddresses, firstName, lastName } = await auth()
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: emailAddresses?.[0]?.emailAddress || '',
          name: firstName && lastName ? `${firstName} ${lastName}` : null,
        }
      })
    }

    const project = await prisma.project.create({
      data: {
        title: title || 'Untitled Project',
        content: content || '',
        description,
        userId: user.id,
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
