import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditorClient from '../editor-client'

interface Props {
  params: {
    id: string
  }
}

export default async function EditProjectPage({ params }: Props) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    redirect('/sign-in')
  }

  // Get project
  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: user.id
    }
  })

  if (!project) {
    redirect('/dashboard')
  }

  return <EditorClient initialProject={project} />
}
