'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { 
  Activity, Zap, MessageSquare, Clock, TrendingUp, AlertTriangle,
  Download, RefreshCw, Users, HardDrive, BrainCircuit
} from 'lucide-react'
import { usageApi } from '@/lib/api'

interface UsageData {
  usage: {
    today: {
      llmRequests: number
      calls: number
      sttMinutes: number
      ttsCharacters: number
    }
    monthly: {
      llmRequests: number
      calls: number
      sttMinutes: number
      ttsCharacters: number
    }
  }
  limits: {
    maxCallsPerDay: number
    maxLlmRequestsPerDay: number
    maxCallsPerMonth: number
  }
  allowed: boolean
  exceeded: Record<string, any>
  lifetime: {
    totalCalls: number
    totalLlmRequests: number
    totalMinutes: number
  }
}

interface DailyUsage {
  date: string
  llmRequests: number
  calls: number
  sttMinutes: number
  ttsCharacters: number
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [dailyData, setDailyData] = useState<DailyUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsage = async () => {
    try {
      const [usageRes, dailyRes] = await Promise.all([
        usageApi.getCurrent(),
        usageApi.getDaily(30)
      ])
      setUsage(usageRes.data)
      setDailyData(dailyRes.data)
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsage()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Unable to load usage data</p>
      </div>
    )
  }

  const dailyCallsData = dailyData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    calls: d.calls,
    llmRequests: d.llmRequests,
  }))

  const usageDistribution = [
    { name: 'LLM Requests', value: usage.usage.monthly.llmRequests, color: COLORS[0] },
    { name: 'Calls', value: usage.usage.monthly.calls, color: COLORS[1] },
    { name: 'STT Minutes', value: usage.usage.monthly.sttMinutes, color: COLORS[2] },
    { name: 'TTS Characters', value: Math.floor(usage.usage.monthly.ttsCharacters / 1000), color: COLORS[3] },
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Usage Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor your API usage and limits
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Alert */}
      {!usage.allowed && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Usage Limits Exceeded
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {Object.entries(usage.exceeded).map(([key, val]: any) => (
                    <span key={key}>
                      {key}: {val.current}/{val.limit}
                    </span>
                  )).join(' • ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LLM Requests</CardTitle>
            <BrainCircuit className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.usage.today.llmRequests}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily limit: {usage.limits.maxLlmRequestsPerDay}
            </p>
            <Progress 
              value={(usage.usage.today.llmRequests / usage.limits.maxLlmRequestsPerDay) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.usage.today.calls}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily limit: {usage.limits.maxCallsPerDay}
            </p>
            <Progress 
              value={(usage.usage.today.calls / usage.limits.maxCallsPerDay) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">STT Minutes</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.usage.today.sttMinutes}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Speech-to-usage time
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TTS Characters</CardTitle>
            <Volume2 className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.usage.today.ttsCharacters.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Text-to-speech characters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              30-Day Usage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCallsData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  name="Calls"
                />
                <Line 
                  type="monotone" 
                  dataKey="llmRequests" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="LLM Requests"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Monthly Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {usageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Lifetime Statistics
          </CardTitle>
          <CardDescription>
            All-time usage since account creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {usage.lifetime.totalCalls.toLocaleString()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Calls</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {usage.lifetime.totalLlmRequests.toLocaleString()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">LLM Requests</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.floor(usage.lifetime.totalMinutes / 60)}h {usage.lifetime.totalMinutes % 60}m
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Talk Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Import missing icons
import { PhoneCall, Volume2 } from 'lucide-react'
