'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { campaignsApi, agentsApi } from '@/lib/api'
import { 
  Megaphone, Phone, Play, Pause, Trash2, Plus, 
  Loader2, Activity, Zap, CheckCircle2, XCircle
} from 'lucide-react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  
  // New campaign state
  const [name, setName] = useState('')
  const [agentId, setAgentId] = useState('')
  const [numbersText, setNumbersText] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [campRes, agentRes]: any = await Promise.all([
        campaignsApi.getAll(),
        agentsApi.getAll()
      ])
      setCampaigns(campRes.campaigns || [])
      setAgents(agentRes.agents || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name || !agentId || !numbersText) return
    setCreating(true)
    
    // Parse comma or newline separated numbers
    const numbers = numbersText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 5)
    
    try {
      await campaignsApi.create({ name, agentId, phoneNumbers: numbers })
      setShowCreate(false)
      setName('')
      setAgentId('')
      setNumbersText('')
      fetchData()
    } catch (e) {
      alert('Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handleStart = async (id: string) => {
    try {
       await campaignsApi.start(id)
       fetchData()
    } catch (e) {
       alert('Failed to start')
    }
  }

  const handlePause = async (id: string) => {
    try {
       await campaignsApi.pause(id)
       fetchData()
    } catch (e) {
       alert('Failed to pause')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await campaignsApi.delete(id)
      fetchData()
    } catch (e) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Batch Campaigns</h1>
                <p className="text-sm text-slate-500 font-light">Automate outbound AI calls to multiple numbers</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreate(!showCreate)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-light rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-thin mb-4">Create New Campaign</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-light text-slate-500 mb-1 block">Campaign Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lead Follow-up" />
              </div>
              <div>
                <label className="text-xs font-light text-slate-500 mb-1 block">Select Agent</label>
                <select 
                  value={agentId} 
                  onChange={e => setAgentId(e.target.value)}
                  className="w-full h-10 px-3 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="">Choose...</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-light text-slate-500 mb-1 block">Phone Numbers (one per line, with country code)</label>
              <textarea 
                value={numbersText}
                onChange={e => setNumbersText(e.target.value)}
                className="w-full h-32 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono overflow-auto"
                placeholder="+1234567890&#10;+0987654321"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !name || !agentId || !numbersText} className="bg-purple-600 text-white hover:bg-purple-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Create Campaign
            </Button>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-light">No campaigns created yet.</div>
        ) : campaigns.map(camp => (
          <div key={camp._id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 relative group hover:shadow-xl transition-all">
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4 text-xs font-light flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-white dark:bg-slate-950">
              {camp.status === 'running' && <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Running</>}
              {camp.status === 'paused' && <><div className="w-2 h-2 rounded-full bg-orange-500" /> Paused</>}
              {camp.status === 'completed' && <><CheckCircle2 className="w-3 h-3 text-blue-500" /> Completed</>}
              {camp.status === 'draft' && <><div className="w-2 h-2 rounded-full bg-slate-400" /> Draft</>}
            </div>

            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1 pr-24">{camp.name}</h3>
            <div className="flex items-center gap-2 mb-4 text-sm font-light text-slate-500">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              <span>{camp.agentId?.name || 'Unknown Agent'}</span>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-light text-slate-600 dark:text-slate-400">
                <span>Progress ({camp.completedCount + camp.failedCount}/{camp.totalNumbers})</span>
                <span>{Math.round(((camp.completedCount + camp.failedCount) / camp.totalNumbers) * 100) || 0}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${(camp.completedCount / camp.totalNumbers) * 100}%` }} 
                />
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${(camp.failedCount / camp.totalNumbers) * 100}%` }} 
                />
              </div>
              <div className="flex gap-4 text-xs font-light pt-1">
                <span className="text-green-600 dark:text-green-400">{camp.completedCount} Success</span>
                <span className="text-red-600 dark:text-red-400">{camp.failedCount} Failed</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              {camp.status === 'running' ? (
                <Button variant="secondary" onClick={() => handlePause(camp._id)} className="flex-1 rounded-xl text-xs font-light h-9">
                  <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                </Button>
              ) : camp.status !== 'completed' ? (
                <Button onClick={() => handleStart(camp._id)} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-xs font-light h-9 hover:from-green-600 hover:to-emerald-600">
                  <Play className="w-3.5 h-3.5 mr-2" /> Start Dialing
                </Button>
              ) : (
                <Button disabled variant="outline" className="flex-1 rounded-xl text-xs font-light h-9">
                  Finished
                </Button>
              )}
              
              <Button variant="ghost" onClick={() => handleDelete(camp._id)} className="w-9 h-9 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
