import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import EditorClient from './editor-client'

export default async function EditorPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return <EditorClient />
}
