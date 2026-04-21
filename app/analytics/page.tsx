'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Phone, Clock, DollarSign, Users, Filter, BarChart3, Activity, Zap } from 'lucide-react'

const analyticsData = {
  daily: [
    { date: 'Mon', calls: 145, duration: 2340, cost: 58.5, successRate: 94 },
    { date: 'Tue', calls: 167, duration: 2678, cost: 66.9, successRate: 92 },
    { date: 'Wed', calls: 189, duration: 3120, cost: 78.0, successRate: 95 },
    { date: 'Thu', calls: 156, duration: 2456, cost: 61.4, successRate: 93 },
    { date: 'Fri', calls: 198, duration: 3456, cost: 86.4, successRate: 96 },
    { date: 'Sat', calls: 89, duration: 1234, cost: 30.8, successRate: 91 },
    { date: 'Sun', calls: 67, duration: 890, cost: 22.2, successRate: 89 },
  ],
  agentPerformance: [
    { name: 'Customer Support', calls: 1250, avgDuration: 420, satisfaction: 4.5 },
    { name: 'Sales Assistant', calls: 856, avgDuration: 380, satisfaction: 4.7 },
    { name: 'Technical Support', calls: 2100, avgDuration: 580, satisfaction: 4.3 },
    { name: 'Feedback Collector', calls: 567, avgDuration: 290, satisfaction: 4.6 },
  ],
  callTypes: [
    { name: 'Inbound', value: 68, color: '#8b5cf6' },
    { name: 'Outbound', value: 32, color: '#06b6d4' },
  ],
  kpis: [
    { title: 'Total Calls', value: '4,812', change: '+12.5%', trend: 'up', icon: Phone },
    { title: 'Avg Duration', value: '7:23', change: '+0:45', trend: 'up', icon: Clock },
    { title: 'Total Cost', value: '$404.20', change: '+8.2%', trend: 'up', icon: DollarSign },
    { title: 'Success Rate', value: '93.2%', change: '-1.1%', trend: 'down', icon: TrendingUp },
  ]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('calls')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="space-y-8">
          {/* Premium Header */}
          <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-thin tracking-tight text-slate-900 dark:text-white">
                      Analytics Dashboard
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
                      Monitor your voice agent performance and metrics
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40 h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-2xl">
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="h-12 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-2xl">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsData.kpis.map((kpi, index) => (
            <div key={index} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    index === 0 ? 'from-blue-500 to-cyan-500' :
                    index === 1 ? 'from-purple-500 to-pink-500' :
                    index === 2 ? 'from-green-500 to-emerald-500' :
                    'from-orange-500 to-red-500'
                  } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <kpi.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    kpi.trend === 'up' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'
                  }`}></div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light">{kpi.title}</div>
                  <div className="text-3xl font-thin text-slate-900 dark:text-white">{kpi.value}</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-light ${
                      kpi.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {kpi.change}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">vs last period</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Call Volume Chart */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Call Volume Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="calls" stroke="#8b5cf6" fill="url(#colorGradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Call Types Distribution */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Call Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.callTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.callTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  labelStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Agent Performance</h2>
          </div>
          <div className="space-y-4">
            {analyticsData.agentPerformance.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/30 dark:border-slate-700/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium font-light">{agent.name}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{agent.calls} calls</p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-light">Avg Duration</p>
                    <p className="text-slate-900 dark:text-white font-medium font-light">{Math.floor(agent.avgDuration / 60)}:{(agent.avgDuration % 60).toString().padStart(2, '0')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-light">Satisfaction</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-900 dark:text-white font-medium font-light">{agent.satisfaction}</span>
                      <span className="text-yellow-500">/5</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10">
                    Active
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-thin text-slate-900 dark:text-white">Cost Analysis</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                labelStyle={{ color: '#1e293b' }}
              />
              <Bar dataKey="cost" fill="url(#costGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
