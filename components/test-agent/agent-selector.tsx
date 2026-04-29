'use client'

import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { agentsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

interface AgentSelectorProps {
  selectedAgentId: string
  onSelect: (id: string) => void
  onReset: () => void
}

export function AgentSelector({
  selectedAgentId,
  onSelect,
  onReset,
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    agentsApi.getAll().then((res: any) => {
      if (res && res.agents) {
        setAgents(res.agents)
      }
    }).catch(console.error)
  }, [])

  const selectedAgent = agents.find(a => a._id === selectedAgentId || a.id === selectedAgentId)

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-50">Select Agent</h2>

        <div>
          <label className="text-sm text-slate-200 block mb-3">Agent</label>
          <Select value={selectedAgentId} onValueChange={onSelect}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {agents.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAgent && (
          <div className="space-y-4 border-t border-slate-800 pt-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">System Prompt</p>
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded p-3 max-h-20 overflow-y-auto">
                {selectedAgent.systemPrompt}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">First Message</p>
              <p className="text-sm text-slate-300 bg-slate-800/50 rounded p-3">
                {selectedAgent.firstMessage}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase">LLM</span>
                <span className="text-sm text-slate-300">{selectedAgent.llm?.provider || 'groq'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase">Voice</span>
                <span className="text-sm text-slate-300">{selectedAgent.voice?.provider || 'edge-tts'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase">Temperature</span>
                <span className="text-sm text-slate-300">{selectedAgent.temperature?.toFixed(2) || '0.70'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase">Status</span>
                <Badge className={selectedAgent.status === 'active' ? 'bg-green-500/10 text-green-500 border-0' : 'bg-slate-800 text-slate-400 border-0'}>
                  {selectedAgent.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full border-slate-700 text-slate-50 hover:bg-slate-800 gap-2"
        >
          <RotateCcw size={18} />
          Reset Conversation
        </Button>
      </div>
    </Card>
  )
}
