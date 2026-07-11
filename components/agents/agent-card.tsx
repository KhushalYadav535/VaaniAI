'use client'

import { Agent } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MoreVertical, Trash2, Edit2, Play, Copy, Phone, Clock,
  Zap, ToggleLeft, ToggleRight, ExternalLink, Mic, Brain
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { agentsApi } from '@/lib/api'

interface AgentCardProps {
  agent: Agent
  onDelete: (id: string) => void
  onRefresh: () => void
  viewMode?: 'grid' | 'list'
}

const AGENT_COLORS = [
  'from-violet-600 to-purple-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-green-600',
  'from-orange-600 to-amber-600',
  'from-pink-600 to-rose-600',
  'from-indigo-600 to-blue-600',
]

const LLM_BADGES: Record<string, { label: string; color: string }> = {
  openrouter: { label: 'OpenRouter', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  groq:       { label: 'Groq',       color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  openai:     { label: 'OpenAI',     color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  gemini:     { label: 'Gemini',     color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
}

function getColorForAgent(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
}

export function AgentCard({ agent, onDelete, onRefresh, viewMode = 'grid' }: AgentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isTogglingPublic, setIsTogglingPublic] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const avatarGradient = getColorForAgent(agent.name)
  const initials = agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const llmBadge = LLM_BADGES[agent.llm?.provider] || LLM_BADGES['openrouter']

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.toggleStatus(agent._id!, agent.status === 'active' ? 'inactive' : 'active')
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true)
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.togglePublic(agent._id!, agent.isPublic ? false : true)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsTogglingPublic(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const { agentsApi } = await import('@/lib/api')
      await agentsApi.duplicate(agent._id)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsDuplicating(false)
    }
  }

  if (viewMode === 'list') {
    return (
      <>
        <div className="group flex items-center gap-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-500/20 transition-all duration-300">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{agent.name}</h3>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.status === 'active' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'}`} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agent.systemPrompt}</p>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{agent.callsCount ?? 0} calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{agent.totalMinutes ?? 0} min</span>
            </div>
            <Badge className={`text-xs font-medium border ${llmBadge.color}`}>{llmBadge.label}</Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={() => window.location.href = `/agents/${agent._id}/edit`}
              className="h-8 px-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs shadow-md"
            >
              <Edit2 className="w-3 h-3 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => window.location.href = `/test-agent?agentId=${agent._id}`}
              className="h-8 px-3 text-xs border-slate-200 dark:border-slate-700"
            >
              <Play className="w-3 h-3 mr-1" /> Test
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <MoreVertical size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg">
                  <Copy size={14} className="mr-2" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus} disabled={isTogglingStatus} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg">
                  {agent.status === 'active' ? <ToggleLeft size={14} className="mr-2" /> : <ToggleRight size={14} className="mr-2" />}
                  {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePublic} disabled={isTogglingPublic} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg">
                  {agent.isPublic ? <ToggleLeft size={14} className="mr-2 text-slate-400" /> : <ToggleRight size={14} className="mr-2 text-purple-500" />}
                  {isTogglingPublic ? 'Updating…' : agent.isPublic ? 'Hide from Visitors' : 'Show to Visitors'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-800/50" />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10 rounded-lg">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <DeleteDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} agent={agent} onDelete={onDelete} />
      </>
    )
  }

  return (
    <>
      <div className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-500 hover:-translate-y-1">
        
        {/* Top gradient accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

        {/* Status dot */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${agent.status === 'active'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            : 'bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {agent.status === 'active' ? 'Live' : 'Idle'}
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0`}>
              <span className="text-white font-bold text-base">{initials}</span>
            </div>
            <div className="flex-1 min-w-0 pr-12">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">{agent.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 font-light leading-relaxed">
                {agent.systemPrompt}
              </p>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs font-medium border ${llmBadge.color}`}>
              <Brain className="w-3 h-3 mr-1" />
              {llmBadge.label}
            </Badge>
            <Badge className="text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Mic className="w-3 h-3 mr-1" />
              {agent.voice?.provider?.replace('-', ' ') || 'TTS'}
            </Badge>
            {agent.language && agent.language !== 'en' && (
              <Badge className="text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                🌐 {agent.language}
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Calls</span>
              </div>
              <p className="text-xl font-thin text-slate-900 dark:text-white">{(agent.callsCount ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Minutes</span>
              </div>
              <p className="text-xl font-thin text-slate-900 dark:text-white">{(agent.totalMinutes ?? 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md shadow-purple-500/20 font-light"
              onClick={() => window.location.href = `/agents/${agent._id}/edit`}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 dark:hover:bg-violet-500/5 dark:hover:border-violet-500/30 dark:hover:text-violet-400 font-light transition-all duration-200"
              onClick={() => window.location.href = `/test-agent?agentId=${agent._id}`}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" /> Test
            </Button>

            {/* Kebab Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl min-w-[160px]">
                <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl mx-1 my-0.5">
                  <Copy size={14} className="mr-2 text-slate-400" />
                  {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus} disabled={isTogglingStatus} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl mx-1 my-0.5">
                  {agent.status === 'active'
                    ? <ToggleLeft size={14} className="mr-2 text-slate-400" />
                    : <ToggleRight size={14} className="mr-2 text-emerald-500" />}
                  {isTogglingStatus ? 'Updating…' : agent.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePublic} disabled={isTogglingPublic} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl mx-1 my-0.5">
                  {agent.isPublic
                    ? <ToggleLeft size={14} className="mr-2 text-slate-400" />
                    : <ToggleRight size={14} className="mr-2 text-purple-500" />}
                  {isTogglingPublic ? 'Updating…' : agent.isPublic ? 'Hide from Visitors' : 'Show to Visitors'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = `/logs?agentId=${agent._id}`} className="text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl mx-1 my-0.5">
                  <ExternalLink size={14} className="mr-2 text-slate-400" /> View Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/60 dark:bg-slate-800/60 mx-1" />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10 rounded-xl mx-1 my-0.5">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <DeleteDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} agent={agent} onDelete={onDelete} />
    </>
  )
}

function DeleteDialog({ open, onOpenChange, agent, onDelete }: { open: boolean; onOpenChange: (v: boolean) => void; agent: Agent; onDelete: (id: string) => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <AlertDialogTitle className="text-slate-900 dark:text-white text-center">Delete Agent</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-center">
            Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">&quot;{agent.name}&quot;</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 mt-2">
          <AlertDialogCancel className="flex-1 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(agent._id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-500/25"
          >
            Delete
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
