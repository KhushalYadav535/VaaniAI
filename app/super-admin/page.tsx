'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { superAdminApi } from '@/lib/api'
import { format } from 'date-fns'
import {
  Users, PhoneCall, Bot, Clock, Search, ShieldCheck,
  Trash2, Crown, RefreshCw, ChevronRight, Phone,
  TrendingUp, Zap, BarChart2, Layers, ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PLANS = ['Free', 'Starter', 'Pro', 'Enterprise']
const PLAN_COLORS: Record<string, string> = {
  Enterprise: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30',
  Pro:        'bg-violet-400/15 text-violet-400 border-violet-400/30',
  Starter:    'bg-blue-400/15 text-blue-400 border-blue-400/30',
  Free:       'bg-slate-700 text-slate-400 border-slate-600',
}

export default function SuperAdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userDetail, setUserDetail] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.role !== 'super_admin') { router.push('/dashboard'); return }
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [sR, uR] = await Promise.all([superAdminApi.getStats(), superAdminApi.getUsers()])
      setStats(sR.data); setUsers(uR.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchCalls = async () => {
    if (calls.length > 0) return
    const res = await superAdminApi.getCalls()
    setCalls(res.data || [])
  }

  const openUser = async (u: any) => {
    setSelectedUser(u); setUserDetail(null)
    const res = await superAdminApi.getUserDetail(u._id)
    setUserDetail(res.data)
  }

  const updatePlan = async (userId: string, plan: string) => {
    setActionLoading(userId + plan)
    await superAdminApi.updateSubscription(userId, plan, plan === 'Free' ? 'inactive' : 'active')
    await fetchAll()
    if (selectedUser?._id === userId) openUser({ _id: userId })
    setActionLoading('')
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user and ALL their data permanently?')) return
    setActionLoading('del' + userId)
    await superAdminApi.deleteUser(userId)
    setUsers(u => u.filter(x => x._id !== userId))
    setSelectedUser(null); setActionLoading('')
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0b0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-slate-400 text-sm font-light">Loading platform data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">

      {/* ── TOP HEADER ─────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[#0d0e14]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Super Admin Console</h1>
              <p className="text-xs text-slate-500">{users.length} registered users &middot; VaaniAI Platform</p>
            </div>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-8 flex gap-0">
          {['Overview', 'Users', 'Calls'].map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'Calls') fetchCalls() }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                tab === t
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

        {/* ── OVERVIEW ──────────────────────────────────────── */}
        {tab === 'Overview' && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', val: stats?.totalUsers ?? 0, sub: `+${stats?.recentUsers ?? 0} this month`, icon: Users, grad: 'from-blue-600 to-cyan-500' },
                { label: 'Total Agents', val: stats?.totalAgents ?? 0, sub: 'across all accounts', icon: Bot, grad: 'from-violet-600 to-purple-500' },
                { label: 'Total Calls', val: (stats?.totalCalls ?? 0).toLocaleString(), sub: `${stats?.callsToday ?? 0} today`, icon: PhoneCall, grad: 'from-emerald-600 to-green-500' },
                { label: 'Total Minutes', val: (stats?.totalMinutes ?? 0).toLocaleString(), sub: `${stats?.callsThisWeek ?? 0} calls this week`, icon: Clock, grad: 'from-orange-500 to-red-500' },
              ].map((s, i) => (
                <div key={i} className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.05] transition-all group overflow-hidden">
                  <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${s.grad} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-4 shadow-lg`}>
                    <s.icon className="w-4.5 h-4.5 text-white w-4 h-4" />
                  </div>
                  <p className="text-2xl font-light text-white">{s.val}</p>
                  <p className="text-xs text-slate-400 mt-1 font-light">{s.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Campaigns', val: stats?.totalCampaigns ?? 0, icon: Layers },
                { label: 'Knowledge Bases', val: stats?.totalKBs ?? 0, icon: BarChart2 },
                { label: 'Avg Calls / User', val: stats?.avgCallsPerUser ?? 0, icon: TrendingUp },
                { label: 'Users with Calls', val: users.filter(u => (u._usage?.calls || 0) > 0).length, icon: Zap },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-lg font-light text-white">{s.val}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Top users */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-medium text-white">Most Active Users</h2>
              </div>
              <div className="divide-y divide-white/5">
                {(stats?.topUsers || []).length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-600">No call data yet</p>
                )}
                {(stats?.topUsers || []).map((u: any, i: number) => (
                  <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                        {u.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{u.user?.name}</p>
                        <p className="text-xs text-slate-500">{u.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-violet-400">
                      <span className="text-sm font-medium">{u.callCount}</span>
                      <span className="text-xs text-slate-600">calls</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── USERS ─────────────────────────────────────────── */}
        {tab === 'Users' && (
          <div className="flex gap-6">
            {/* List */}
            <div className={`${selectedUser ? 'w-1/2' : 'w-full'} space-y-4 transition-all duration-200`}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 text-xs text-slate-500 font-medium px-5 py-3 border-b border-white/5 uppercase tracking-wider">
                  <span className="col-span-5">User</span>
                  <span className="col-span-2 text-center">Agents</span>
                  <span className="col-span-2 text-center">Calls</span>
                  <span className="col-span-3 text-center">Plan</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[65vh] overflow-y-auto">
                  {filtered.map(u => (
                    <div key={u._id} onClick={() => openUser(u)}
                      className={`grid grid-cols-12 items-center px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                        selectedUser?._id === u._id ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''
                      }`}>
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{u.name}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-violet-400 font-medium">{u._usage?.agents ?? 0}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-emerald-400 font-medium">{u._usage?.calls ?? 0}</span>
                      </div>
                      <div className="col-span-3 flex justify-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PLAN_COLORS[u.settings?.plan || 'Free']}`}>
                          {u.settings?.plan || 'Free'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-sm text-slate-600">No users found</div>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Panel */}
            {selectedUser && (
              <div className="w-1/2 bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Panel Header */}
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                        {selectedUser.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{selectedUser.name}</p>
                        <p className="text-xs text-slate-400">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${PLAN_COLORS[selectedUser.settings?.plan || 'Free']}`}>
                      {selectedUser.settings?.plan || 'Free'}
                    </span>
                    <span className="text-xs text-slate-500">Joined {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                  {/* Usage */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Agents', val: selectedUser._usage?.agents ?? 0, color: 'text-violet-400' },
                      { label: 'Calls', val: selectedUser._usage?.calls ?? 0, color: 'text-emerald-400' },
                      { label: 'Minutes', val: selectedUser._usage?.totalMinutes ?? 0, color: 'text-orange-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                        <p className={`text-xl font-light ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Plan change */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Change Plan</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PLANS.map(plan => (
                        <button key={plan}
                          disabled={actionLoading === selectedUser._id + plan}
                          onClick={() => updatePlan(selectedUser._id, plan)}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                            (selectedUser.settings?.plan || 'Free') === plan
                              ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                              : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                          }`}>
                          {plan === 'Enterprise' && '👑 '}{plan}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Agents */}
                  {userDetail?.agents?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Agents ({userDetail.agents.length})</p>
                      <div className="space-y-1.5">
                        {userDetail.agents.map((a: any) => (
                          <div key={a._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                              <span className="text-sm text-slate-300">{a.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">{a.callsCount || 0} calls</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent calls */}
                  {userDetail?.recentCalls?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Recent Calls</p>
                      <div className="space-y-1.5">
                        {userDetail.recentCalls.slice(0, 5).map((c: any) => (
                          <div key={c._id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div>
                              <p className="text-xs text-slate-300">{c.agentName}</p>
                              <p className="text-xs text-slate-600">{c.startTime ? format(new Date(c.startTime), 'MMM d, h:mm a') : '—'}</p>
                            </div>
                            <span className="text-xs text-slate-500">{Math.round((c.duration || 0) / 60)}m {(c.duration || 0) % 60}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!userDetail && (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Danger */}
                  <div className="border border-red-500/15 rounded-xl p-4 bg-red-500/5">
                    <p className="text-xs text-red-400/70 font-medium uppercase tracking-wider mb-3">Danger Zone</p>
                    <button
                      disabled={actionLoading === 'del' + selectedUser._id}
                      onClick={() => deleteUser(selectedUser._id)}
                      className="w-full py-2.5 rounded-xl text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete User & All Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CALLS ─────────────────────────────────────────── */}
        {tab === 'Calls' && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-medium text-white">All Platform Calls</h2>
              <span className="text-xs text-slate-500 ml-auto">Last 100</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {['User', 'Agent', 'Direction', 'Duration', 'Sentiment', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calls.map(c => (
                    <tr key={c._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-white">{c.userId?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{c.userId?.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">{c.agentName}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/5">{c.direction}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">
                        {Math.floor((c.duration || 0) / 60)}m {(c.duration || 0) % 60}s
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium ${
                          c.sentiment === 'positive' ? 'text-emerald-400' :
                          c.sentiment === 'negative' ? 'text-red-400' : 'text-slate-400'
                        }`}>{c.sentiment || 'neutral'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs ${c.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {c.startTime ? format(new Date(c.startTime), 'MMM d, h:mm a') : '—'}
                      </td>
                    </tr>
                  ))}
                  {calls.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-600">No calls recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
