import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function SignOutPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Signing you out...
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Please wait while we sign you out.
        </p>
      </div>
    </div>
  )
}
