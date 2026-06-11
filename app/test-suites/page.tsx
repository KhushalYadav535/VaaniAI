'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { testSuitesApi, agentsApi } from '@/lib/api'
import {
  ClipboardCheck, Plus, Loader2, Trash2, Play,
  CheckCircle2, XCircle, ChevronRight, Bot, FlaskConical,
} from 'lucide-react'

interface ScenarioDraft {
  name: string
  personaPrompt: string
  openingMessage: string
  successCriteriaText: string
  maxTurns: number
}

const blankScenario = (): ScenarioDraft => ({
  name: '',
  personaPrompt: '',
  openingMessage: '',
  successCriteriaText: '',
  maxTurns: 6,
})

export default function TestSuitesPage() {
  const [suites, setSuites] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agentId, setAgentId] = useState('')
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([blankScenario()])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [suiteRes, agentRes]: any = await Promise.all([
        testSuitesApi.getAll(),
        agentsApi.getAll(),
      ])
      setSuites(suiteRes.suites || [])
      setAgents(agentRes.agents || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName(''); setDescription(''); setAgentId(''); setScenarios([blankScenario()])
  }

  const updateScenario = (idx: number, patch: Partial<ScenarioDraft>) => {
    setScenarios(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }

  const handleCreate = async () => {
    if (!name || !agentId) return
    const cleanScenarios = scenarios
      .filter(s => s.name && s.personaPrompt)
      .map(s => ({
        name: s.name,
        personaPrompt: s.personaPrompt,
        openingMessage: s.openingMessage,
        maxTurns: s.maxTurns,
        successCriteria: s.successCriteriaText
          .split('\n')
          .map(c => c.trim())
          .filter(Boolean),
      }))

    if (cleanScenarios.length === 0) {
      alert('Add at least one scenario with a name and persona.')
      return
    }

    setCreating(true)
    try {
      await testSuitesApi.create({ name, description, agentId, scenarios: cleanScenarios })
      setShowCreate(false)
      resetForm()
      fetchData()
    } catch (e: any) {
      alert(`Failed to create test suite: ${e.message || ''}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this test suite and its run history?')) return
    try { await testSuitesApi.delete(id); fetchData() } catch { alert('Failed to delete') }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-cyan-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Test Suites</h1>
                <p className="text-sm text-slate-500 font-light">
                  Automatically simulate calls against your agent and grade them — no phone needed.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-light rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Suite
            </Button>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-thin">Create Test Suite</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-light text-slate-500 mb-1 block">Suite Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Refund handling regression" />
            </div>
            <div>
              <label className="text-xs font-light text-slate-500 mb-1 block">Agent under test</label>
              <select
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
                aria-label="Select agent to test"
                className="w-full h-10 px-3 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">Choose...</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-light text-slate-500 mb-1 block">Description (optional)</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this suite verify?" />
          </div>

          {/* Scenarios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                <FlaskConical className="w-3.5 h-3.5" /> Scenarios
              </div>
              <Button
                type="button" variant="ghost" size="sm"
                onClick={() => setScenarios(p => [...p, blankScenario()])}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add scenario
              </Button>
            </div>

            {scenarios.map((s, idx) => (
              <div key={idx} className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={s.name}
                    onChange={e => updateScenario(idx, { name: e.target.value })}
                    placeholder={`Scenario ${idx + 1} name (e.g. Angry customer)`}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-400">Max turns</label>
                    <Input
                      type="number" min={1} max={20}
                      value={s.maxTurns}
                      onChange={e => updateScenario(idx, { maxTurns: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>
                  {scenarios.length > 1 && (
                    <Button
                      type="button" variant="ghost"
                      onClick={() => setScenarios(p => p.filter((_, i) => i !== idx))}
                      className="w-9 h-9 p-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Remove scenario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-light text-slate-500 mb-1 block">Caller persona &amp; goal</label>
                  <textarea
                    value={s.personaPrompt}
                    onChange={e => updateScenario(idx, { personaPrompt: e.target.value })}
                    className="w-full h-20 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    placeholder="You are a frustrated customer whose order never arrived. You want a refund and you are impatient."
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Opening line (optional)</label>
                    <Input
                      value={s.openingMessage}
                      onChange={e => updateScenario(idx, { openingMessage: e.target.value })}
                      placeholder="Where is my order?!"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-light text-slate-500 mb-1 block">Success criteria (one per line)</label>
                    <textarea
                      value={s.successCriteriaText}
                      onChange={e => updateScenario(idx, { successCriteriaText: e.target.value })}
                      className="w-full h-20 px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                      placeholder={'Agent stayed calm and polite\nAgent offered to escalate\nAgent never promised a specific refund amount'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); resetForm() }}>Cancel</Button>
            <Button
              type="button" onClick={handleCreate}
              disabled={creating || !name || !agentId}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
              Create Suite
            </Button>
          </div>
        </div>
      )}

      {/* Suites list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : suites.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-light">
            No test suites yet. Create one to start simulating calls.
          </div>
        ) : suites.map(suite => {
          const pass = suite.lastPassRate
          return (
            <Link
              key={suite._id}
              href={`/test-suites/${suite._id}`}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 relative group hover:shadow-xl transition-all block"
            >
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1 pr-8">{suite.name}</h3>
              <div className="flex items-center gap-2 mb-4 text-sm font-light text-slate-500">
                <Bot className="w-3.5 h-3.5 text-violet-500" />
                <span>{suite.agentId?.name || 'Unknown Agent'}</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-light text-slate-500 mb-4">
                <span>{suite.scenarios?.length || 0} scenarios</span>
                {suite.lastRunAt && (
                  <span>Last run {new Date(suite.lastRunAt).toLocaleDateString()}</span>
                )}
              </div>

              {pass !== null && pass !== undefined ? (
                <div className="flex items-center gap-2">
                  {pass >= 80
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm font-medium ${pass >= 80 ? 'text-green-600' : pass >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {pass}% pass rate
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-light italic">Not run yet</div>
              )}

              <ChevronRight className="absolute top-6 right-5 w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleDelete(suite._id) }}
                className="absolute bottom-5 right-5 w-8 h-8 p-0 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete suite"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
