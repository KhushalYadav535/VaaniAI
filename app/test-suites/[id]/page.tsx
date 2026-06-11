'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { testSuitesApi } from '@/lib/api'
import {
  ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Bot, User,
  ChevronDown, ChevronRight, Clock, Gauge,
} from 'lucide-react'

export default function TestSuiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const suiteId = params.id as string

  const [suite, setSuite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [activeRun, setActiveRun] = useState<any>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSuite = useCallback(async () => {
    try {
      const res: any = await testSuitesApi.getById(suiteId)
      setSuite(res.suite)
      // Surface the most recent run by default.
      if (res.suite?.runs?.length && !activeRun) {
        setActiveRun(res.suite.runs[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [suiteId, activeRun])

  useEffect(() => {
    fetchSuite()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suiteId])

  const pollRun = (runId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res: any = await testSuitesApi.getRun(suiteId, runId)
        setActiveRun(res.run)
        if (res.run.status === 'completed' || res.run.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setRunning(false)
          fetchSuite()
        }
      } catch (e) {
        console.error(e)
        if (pollRef.current) clearInterval(pollRef.current)
        setRunning(false)
      }
    }, 2000)
  }

  const handleRun = async () => {
    setRunning(true)
    setActiveRun({ status: 'running', total: suite.scenarios?.length || 0, passed: 0, failed: 0, results: [] })
    try {
      const res: any = await testSuitesApi.run(suiteId)
      pollRun(res.runId)
    } catch (e: any) {
      alert(`Failed to start run: ${e.message || ''}`)
      setRunning(false)
    }
  }

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!suite) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-slate-500">Test suite not found.</p>
        <Button variant="ghost" onClick={() => router.push('/test-suites')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    )
  }

  const results = activeRun?.results || []
  const completedCount = results.length
  const totalCount = activeRun?.total || suite.scenarios?.length || 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
        <button
          type="button"
          onClick={() => router.push('/test-suites')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All suites
        </button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-thin text-slate-900 dark:text-white">{suite.name}</h1>
            {suite.description && <p className="text-sm text-slate-500 font-light mt-1">{suite.description}</p>}
            <div className="flex items-center gap-2 mt-3 text-sm font-light text-slate-500">
              <Bot className="w-3.5 h-3.5 text-violet-500" />
              <span>{suite.agentId?.name || 'Unknown Agent'}</span>
              <span className="text-slate-300">•</span>
              <span>{suite.scenarios?.length || 0} scenarios</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleRun}
            disabled={running || (suite.scenarios?.length || 0) === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? 'Running...' : 'Run Suite'}
          </Button>
        </div>
      </div>

      {/* Run progress / summary */}
      {activeRun && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-thin text-slate-900 dark:text-white">
                  {activeRun.status === 'completed' ? `${activeRun.passRate}%` : `${progressPct}%`}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  {activeRun.status === 'completed' ? 'Pass rate' : 'Progress'}
                </div>
              </div>
              <div className="flex gap-3 text-sm font-light">
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> {activeRun.passed || 0} passed
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <XCircle className="w-4 h-4" /> {activeRun.failed || 0} failed
                </span>
              </div>
            </div>
            {activeRun.status === 'running' && (
              <span className="flex items-center gap-2 text-sm text-violet-600 font-light">
                <Loader2 className="w-4 h-4 animate-spin" />
                Simulating {completedCount}/{totalCount}...
              </span>
            )}
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${activeRun.status === 'completed' ? 100 : progressPct}%` }}
            />
          </div>

          {/* Per-scenario results */}
          <div className="space-y-3 pt-2">
            {results.map((r: any, idx: number) => {
              const key = `${activeRun._id || 'run'}-${idx}`
              const isOpen = expanded[key]
              return (
                <div key={key} className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {r.passed
                        ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Gauge className="w-3.5 h-3.5" /> {r.score}/100
                      </span>
                      {r.latencyMsAvg > 0 && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" /> {r.latencyMsAvg}ms avg
                        </span>
                      )}
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                      {r.error ? (
                        <p className="text-sm text-red-500">Error: {r.error}</p>
                      ) : (
                        <>
                          {r.reasoning && (
                            <div>
                              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Grader reasoning</div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 font-light">{r.reasoning}</p>
                            </div>
                          )}

                          {r.criteriaResults?.length > 0 && (
                            <div>
                              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Success criteria</div>
                              <div className="space-y-1.5">
                                {r.criteriaResults.map((c: any, i: number) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    {c.met
                                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                      : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                                    <span className="font-light text-slate-600 dark:text-slate-300">{c.criterion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {r.transcript?.length > 0 && (
                            <div>
                              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">Transcript</div>
                              <div className="space-y-2">
                                {r.transcript.map((m: any, i: number) => (
                                  <div key={i} className={`flex gap-2 ${m.role === 'caller' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                      m.role === 'caller' ? 'bg-cyan-100 dark:bg-cyan-900/40' : 'bg-violet-100 dark:bg-violet-900/40'
                                    }`}>
                                      {m.role === 'caller'
                                        ? <User className="w-3.5 h-3.5 text-cyan-600" />
                                        : <Bot className="w-3.5 h-3.5 text-violet-600" />}
                                    </div>
                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm font-light ${
                                      m.role === 'caller'
                                        ? 'bg-cyan-50 dark:bg-cyan-950/30 text-slate-700 dark:text-slate-200'
                                        : 'bg-violet-50 dark:bg-violet-950/30 text-slate-700 dark:text-slate-200'
                                    }`}>
                                      {m.text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Scenario definitions (when no run selected) */}
      {!activeRun && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <h2 className="text-lg font-thin mb-4">Scenarios</h2>
          <div className="space-y-3">
            {(suite.scenarios || []).map((s: any, idx: number) => (
              <div key={idx} className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4">
                <div className="font-medium text-slate-800 dark:text-slate-200">{s.name}</div>
                <p className="text-sm text-slate-500 font-light mt-1">{s.personaPrompt}</p>
                {s.successCriteria?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.successCriteria.map((c: string, i: number) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
