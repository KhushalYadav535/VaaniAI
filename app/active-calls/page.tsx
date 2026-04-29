'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Activity, PhoneOff, Mic, Ear, Search, Filter, Loader2, PhoneCall } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { callsApi } from '@/lib/api'
export default function ActiveCallsPage() {
  const [activeCalls, setActiveCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveCalls = async () => {
      try {
        const res = await callsApi.getActive()
        if (res.success && res.activeCalls) {
          const mapped = res.activeCalls.map((c: any) => {
            // calculate duration
            const startTime = new Date(c.startTime).getTime()
            const now = new Date().getTime()
            const diffSeconds = Math.floor((now - startTime) / 1000)
            const m = Math.floor(diffSeconds / 60)
            const s = diffSeconds % 60
            const durationStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

            return {
              id: c._id,
              agentName: c.agentId?.name || 'Unknown Agent',
              customerNumber: c.fromNumber || c.toNumber || 'Web Caller',
              duration: durationStr,
              status: c.status,
              sentiment: c.sentiment || 'neutral',
              isListening: false,
              transcript: c.transcript || []
            }
          })
          setActiveCalls(mapped)
        }
      } catch (err) {
        console.error('Failed to fetch active calls:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveCalls()
    const interval = setInterval(fetchActiveCalls, 5000) // Poll every 5s

    return () => clearInterval(interval)
  }, [])

  const toggleListen = (id: string) => {
    setActiveCalls(calls => 
      calls.map(c => c.id === id ? { ...c, isListening: !c.isListening } : c)
    )
  }

  const endCall = (id: string) => {
    setActiveCalls(calls => calls.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-teal-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 relative">
                <Activity className="w-5 h-5 text-white animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Active Calls</h1>
                <p className="text-sm text-slate-500 font-light">Monitor and barge-in to ongoing AI conversations in real-time.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input 
                  placeholder="Search calls..." 
                  className="pl-9 h-10 w-64 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl font-light text-sm"
                />
              </div>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200/50 dark:border-slate-700/50">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p className="font-light">Connecting to live telephony streams...</p>
        </div>
      ) : activeCalls.length === 0 ? (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Active Calls</h3>
          <p className="text-slate-500 dark:text-slate-400 font-light text-sm max-w-md mx-auto">
            There are currently no ongoing calls. When users call your phone numbers or use the web widget, they will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeCalls.map(call => (
            <div key={call.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">{call.customerNumber}</h3>
                    <p className="text-xs text-slate-500 font-light">{call.agentName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{call.duration}</span>
                  <div className="mt-1">
                    <Badge variant={call.sentiment === 'negative' ? 'destructive' : 'secondary'} className="text-[10px] font-normal uppercase tracking-wider">
                      {call.sentiment}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-slate-900 text-slate-300 font-mono text-xs h-32 overflow-y-auto relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                <div className="space-y-3 pl-2">
                  {call.transcript && call.transcript.length > 0 ? (
                    call.transcript.map((msg: any, i: number) => (
                      <p key={i}>
                        <span className={`font-semibold mr-2 ${msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                          {msg.role === 'user' ? 'User:' : 'AI:'}
                        </span> 
                        {msg.content}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-500 italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                      Customer is speaking...
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between gap-3">
                <Button 
                  variant={call.isListening ? "default" : "secondary"}
                  className={`flex-1 rounded-xl shadow-none ${call.isListening ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  onClick={() => toggleListen(call.id)}
                >
                  <Ear className={`w-4 h-4 mr-2 ${call.isListening ? 'animate-pulse' : ''}`} />
                  {call.isListening ? 'Listening...' : 'Listen In'}
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
                  disabled={!call.isListening}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Barge In
                </Button>

                <Button 
                  variant="destructive"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => endCall(call.id)}
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
