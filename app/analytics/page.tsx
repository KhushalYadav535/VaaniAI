'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { analyticsApi } from '@/lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, Phone, Clock, Users, BarChart3,
  Activity, Zap, CheckCircle, RefreshCw, Loader2
} from 'lucide-react'

type Period = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [overview, setOverview] = useState<any>(null)
  const [timeData, setTimeData] = useState<any[]>([])
  const [topAgents, setTopAgents] = useState<any[]>([])
  const [intentData, setIntentData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll(period)
  }, [period])

  const loadAll = async (p: Period) => {
    setLoading(true)
    try {
      const [ovRes, timeRes, agentsRes, intentRes]: any[] = await Promise.all([
        analyticsApi.getOverview(p).catch(() => ({ overview: null })),
        analyticsApi.getCallsOverTime(p).catch(() => ({ data: [] })),
        analyticsApi.getTopAgents(p).catch(() => ({ data: [] })),
        analyticsApi.getIntentDistribution(p).catch(() => ({ data: [] })),
      ])
      setOverview(ovRes?.overview || null)
      setTimeData(timeRes?.data || [])
      setTopAgents(agentsRes?.data || [])
      setIntentData(intentRes?.data || [])
    } catch (e) {
      console.error('Analytics load error', e)
    } finally {
      setLoading(false)
    }
  }

  const kpis = overview ? [
    {
      title: 'Total Calls',
      value: (overview.totalCalls || 0).toLocaleString(),
      sub: `${overview.completedCalls || 0} completed`,
      icon: Phone,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Success Rate',
      value: `${overview.successRate || 0}%`,
      sub: `${overview.failedCalls || 0} failed`,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Total Minutes',
      value: (overview.totalDurationMinutes || 0).toLocaleString(),
      sub: `Avg ${overview.avgDurationSeconds ? Math.round(overview.avgDurationSeconds / 60) : 0}m/call`,
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Active Agents',
      value: overview.activeAgents || 0,
      sub: `of ${overview.totalAgents || 0} total`,
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Avg QA Score',
      value: overview.avgQaScore ? `${overview.avgQaScore}/100` : 'N/A',
      sub: 'AI quality rating',
      icon: TrendingUp,
      gradient: 'from-pink-500 to-rose-500',
    },
  ] : []

  // Format time-series data for chart
  const chartData = timeData.map(d => ({
    date: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    calls: d.calls || 0,
    completed: d.completed || 0,
    minutes: Math.round((d.duration || 0) / 60),
  }))

  // Success vs fail data for pie
  const pieData = overview ? [
    { name: 'Completed', value: overview.completedCalls || 0, color: '#22c55e' },
    { name: 'Failed', value: overview.failedCalls || 0, color: '#ef4444' },
    { name: 'Other', value: Math.max(0, (overview.totalCalls || 0) - (overview.completedCalls || 0) - (overview.failedCalls || 0)), color: '#94a3b8' },
  ].filter(d => d.value > 0) : []

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Analytics</h1>
                <p className="text-sm text-slate-500 font-light">Real-time performance metrics from your MongoDB</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-36 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-light text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => loadAll(period)}
                className="h-10 rounded-2xl border-slate-200/50 dark:border-slate-700/50 font-light text-sm gap-1.5">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm text-slate-500 font-light">Loading analytics from database...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.length === 0 ? (
              <div className="col-span-4 text-center py-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
                <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-light text-sm">No call data yet. Make some calls from the Test Agent page!</p>
              </div>
            ) : kpis.map((kpi, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs font-light text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{kpi.title}</p>
                <p className="text-3xl font-thin text-slate-900 dark:text-white mb-1">{kpi.value}</p>
                <p className="text-xs font-light text-slate-500 dark:text-slate-400">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Call Volume Area Chart */}
            <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Call Volume</h2>
              </div>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm font-light">No data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.2} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 300 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 300 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="calls" stroke="#8b5cf6" fill="url(#callGrad)" strokeWidth={2} name="Total Calls" />
                    <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Call Status</h2>
              </div>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-52 text-slate-400 text-sm font-light">No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-xs font-light text-slate-600 dark:text-slate-400">{d.name}</span>
                        </div>
                        <span className="text-xs font-light text-slate-700 dark:text-slate-300">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Minutes bar chart */}
          {chartData.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Minutes Used Per Day</h2>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.2} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 300 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 300 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', fontSize: 12 }}
                    formatter={(v) => [`${v} min`, 'Minutes']}
                  />
                  <Bar dataKey="minutes" fill="url(#minGrad)" radius={[6, 6, 0, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Customer Intent Bar Chart */}
          {intentData.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 mt-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Customer Intent Breakdown</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={intentData} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 300 }} />
                  <YAxis type="category" dataKey="_id" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 400 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', fontSize: 12 }}
                    formatter={(v) => [`${v} calls`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Agents */}
          {topAgents.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Top Performing Agents</h2>
              </div>
              <div className="space-y-3">
                {topAgents.map((agent, i) => {
                  const successRate = agent.totalCalls > 0 ? Math.round((agent.completed / agent.totalCalls) * 100) : 0
                  return (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
                          <span className="text-sm font-light text-purple-600 dark:text-purple-400">#{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-light text-slate-800 dark:text-slate-200">{agent.agentName || 'Unknown Agent'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">{agent.totalCalls} calls</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-slate-500 font-light">Duration</p>
                          <p className="text-sm font-light text-slate-700 dark:text-slate-300">
                            {agent.totalDuration ? Math.round(agent.totalDuration / 60) : 0}m
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 font-light">Success</p>
                          <p className={`text-sm font-light ${successRate > 80 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                            {successRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state for no data at all */}
          {kpis.length === 0 && topAgents.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/10 to-purple-600/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-thin text-slate-900 dark:text-white mb-2">No Data Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light max-w-md mx-auto">
                Create an agent and start a test call from the <strong>Test Agent</strong> page. Analytics will populate automatically after calls.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
