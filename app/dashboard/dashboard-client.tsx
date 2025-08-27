'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, FileText, Calendar, MoreHorizontal, Loader2 } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import useSWR from 'swr'

interface Project {
  id: string
  title: string
  description: string | null
  content: string
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardClient() {
  const { data: projects, error, isLoading } = useSWR<Project[]>('/api/projects', fetcher)

  const getWordCount = (content: string) => {
    return content.trim() ? content.trim().split(/\s+/).length : 0
  }

  const getProjectStatus = (project: Project) => {
    const wordCount = getWordCount(project.content)
    if (wordCount === 0) return 'draft'
    if (wordCount < 100) return 'draft'
    if (wordCount < 500) return 'in-progress'
    return 'completed'
  }

  const totalWords = projects?.reduce((sum, project) => sum + getWordCount(project.content), 0) || 0
  const draftProjects = projects?.filter(p => getProjectStatus(p) === 'draft').length || 0
  const completedProjects = projects?.filter(p => getProjectStatus(p) === 'completed').length || 0

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Error loading projects
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Please try refreshing the page
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">InkPilot</span>
            </Link>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/editor">
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Continue working on your writing projects or start something new.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Total Projects
              </CardTitle>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  projects?.length || 0
                )}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Words Written
              </CardTitle>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  totalWords.toLocaleString()
                )}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                In Progress
              </CardTitle>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  draftProjects
                )}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Completed
              </CardTitle>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  completedProjects
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Recent Projects
            </h2>
            <Link href="/editor">
              <Button variant="outline">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => {
                const wordCount = getWordCount(project.content)
                const status = getProjectStatus(project)
                
                return (
                  <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <Link href={`/editor/${project.id}`}>
                            <CardTitle className="hover:text-blue-600 transition-colors">
                              {project.title}
                            </CardTitle>
                          </Link>
                          <CardDescription>
                            {project.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {wordCount.toLocaleString()} words
                          </div>
                        </div>
                        <Badge 
                          variant={
                            status === 'completed' 
                              ? 'default' 
                              : status === 'in-progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                Start your writing journey by creating your first project. InkPilot will help you write better with AI-powered suggestions.
              </p>
              <Link href="/editor">
                <Button size="lg">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
