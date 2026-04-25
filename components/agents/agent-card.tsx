'use client'

import { Agent } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreVertical, Trash2, Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface AgentCardProps {
  agent: Agent
  onDelete: (id: string) => void
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{agent.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{agent.systemPrompt}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-50">
                  <MoreVertical size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DropdownMenuItem
                  className="text-slate-700 dark:text-slate-50 focus:bg-slate-100 dark:focus:bg-slate-800"
                  onClick={() => window.location.href = `/agents/${agent._id}/edit`}
                >
                  <Edit2 size={16} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-light">Status</span>
              <Badge className={agent.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 border-0 font-normal' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0 font-normal'}>
                {agent.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-light">LLM</span>
              <span className="text-slate-700 dark:text-slate-200 capitalize font-medium">{agent.llm.provider} - {agent.llm.model.split('/').pop()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-light">Voice</span>
              <span className="text-slate-700 dark:text-slate-200 capitalize font-medium">{agent.voice.provider.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-light">Total Calls</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{agent.callsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-light">Minutes Used</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{agent.totalMinutes.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
              onClick={() => window.location.href = `/agents/${agent._id}/edit`}
            >
              Edit
            </Button>
            <Button size="sm" onClick={() => window.location.href=`/test-agent?agentId=${agent._id}`} variant="outline" className="flex-1 border-slate-200 bg-white/50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-transparent dark:text-slate-50 dark:hover:bg-slate-800">
              Test
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">Delete Agent</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{agent.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel className="border-slate-700 text-slate-50 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(agent._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
