'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { agentsApi } from '@/lib/api'
import {
  FlaskConical, Send, Loader2, Zap, Clock, RotateCcw,
  Copy, Check, SplitSquareHorizontal, MessageSquare, Bot, User
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function PlaygroundPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful customer support agent for VaaniAI. Be friendly, concise, and professional.'
  )
  const [userMessage, setUserMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState('llama-3.1-8b-instant')
  const [temperature, setTemperature] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const [lastLatency, setLastLatency] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // A/B Test
  const [abMode, setAbMode] = useState(false)
  const [promptB, setPromptB] = useState('')
  const [abResult, setAbResult] = useState<any>(null)
  const [abLoading, setAbLoading] = useState(false)

  const countWords = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0
  const countChars = (s: string) => s.length

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!userMessage.trim() || !systemPrompt.trim()) return
    setLoading(true)

    const newUserMsg: Message = { role: 'user', content: userMessage }
    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)
    setUserMessage('')

    try {
      const res: any = await agentsApi.playground({
        systemPrompt,
        userMessage: newUserMsg.content,
        model,
        temperature,
        history: messages,
      })

      setMessages([...updatedMessages, { role: 'assistant', content: res.response }])
      setLastLatency(res.latencyMs)
    } catch (e: any) {
      toast.error(e.message || 'Failed to get response')
    } finally {
      setLoading(false)
    }
  }

  const runAbTest = async () => {
    if (!userMessage.trim() || !systemPrompt.trim() || !promptB.trim()) {
      toast.error('Fill in Prompt A, Prompt B, and a user message')
      return
    }
    setAbLoading(true)
    setAbResult(null)
    try {
      const res: any = await agentsApi.abTest({
        promptA: systemPrompt,
        promptB,
        userMessage,
        model,
        temperature,
      })
      setAbResult(res)
    } catch (e: any) {
      toast.error(e.message || 'A/B test failed')
    } finally {
      setAbLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setLastLatency(null)
    setAbResult(null)
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/5 to-orange-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Prompt Playground</h1>
                <p className="text-sm text-slate-500 font-light">Test & iterate on your agent prompts — free, instant, no voice call needed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={abMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAbMode(!abMode)}
                className="rounded-xl gap-1.5 text-xs"
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
                A/B Test
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat} className="rounded-xl gap-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config */}
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                System Prompt {abMode ? '(A)' : ''}
              </h3>
              <button onClick={copyPrompt} className="text-slate-400 hover:text-slate-600 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="Enter your system prompt..."
              className="text-sm font-light bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl resize-none"
            />

            {abMode && (
              <>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">System Prompt (B)</h3>
                <Textarea
                  value={promptB}
                  onChange={e => setPromptB(e.target.value)}
                  rows={6}
                  placeholder="Enter alternative prompt to compare..."
                  className="text-sm font-light bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl resize-none"
                />
              </>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</SelectItem>
                    <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Smart)</SelectItem>
                    <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Temperature</label>
                  <span className="text-xs text-slate-400">{temperature.toFixed(1)}</span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0} max={1} step={0.1}
                  className="py-1"
                />
              </div>
            </div>

            {lastLatency !== null && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-200/30 dark:border-slate-700/30">
                <Clock className="w-3 h-3" />
                <span>Last response: {lastLatency}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="lg:col-span-2 flex flex-col">
          {!abMode ? (
            /* Regular chat mode */
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-3">
                      <MessageSquare className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-light text-slate-500">Type a message to test your prompt</p>
                    <p className="text-xs text-slate-400 mt-1">Conversation history is maintained across messages</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-light ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 p-4">
                <div className="flex gap-2">
                  <Input
                    value={userMessage}
                    onChange={e => setUserMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a test message..."
                    className="flex-1 h-10 rounded-xl text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50"
                  />
                  <Button onClick={sendMessage} disabled={loading || !userMessage.trim()} className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 gap-1.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* A/B Test mode */
            <div className="space-y-4">
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Test User Message</label>
                <div className="flex gap-2">
                  <Input
                    value={userMessage}
                    onChange={e => setUserMessage(e.target.value)}
                    placeholder="Enter the user message to test both prompts against..."
                    className="flex-1 h-10 rounded-xl text-sm bg-white/50 dark:bg-slate-800/50"
                  />
                  <Button onClick={runAbTest} disabled={abLoading} className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 gap-1.5">
                    {abLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Compare
                  </Button>
                </div>
              </div>

              {abResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Prompt A', result: abResult.resultA },
                      { label: 'Prompt B', result: abResult.resultB },
                    ].map((side) => (
                      <div key={side.label} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{side.label}</h3>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {side.result.latencyMs}ms
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm font-light text-slate-700 dark:text-slate-300 max-h-64 overflow-y-auto">
                          {side.result.response}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Metrics comparison table */}
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Side-by-Side Metrics</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700/50">
                            <th className="text-left py-2 text-slate-400 font-medium">Metric</th>
                            <th className="text-right py-2 text-slate-700 dark:text-slate-300 font-medium">Prompt A</th>
                            <th className="text-right py-2 text-slate-700 dark:text-slate-300 font-medium">Prompt B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                          {[
                            { label: 'Latency', a: `${abResult.resultA.latencyMs}ms`, b: `${abResult.resultB.latencyMs}ms`, better: abResult.resultA.latencyMs < abResult.resultB.latencyMs ? 'A' : abResult.resultB.latencyMs < abResult.resultA.latencyMs ? 'B' : null },
                            { label: 'Response Length (chars)', a: countChars(abResult.resultA.response).toLocaleString(), b: countChars(abResult.resultB.response).toLocaleString(), better: null },
                            { label: 'Word Count', a: countWords(abResult.resultA.response).toLocaleString(), b: countWords(abResult.resultB.response).toLocaleString(), better: null },
                            { label: 'Words/sec', a: (countWords(abResult.resultA.response) / (abResult.resultA.latencyMs / 1000)).toFixed(1), b: (countWords(abResult.resultB.response) / (abResult.resultB.latencyMs / 1000)).toFixed(1), better: null },
                          ].map((row) => (
                            <tr key={row.label}>
                              <td className="py-1.5 text-slate-500">{row.label}</td>
                              <td className={`py-1.5 text-right font-mono ${row.better === 'A' ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>{row.a}</td>
                              <td className={`py-1.5 text-right font-mono ${row.better === 'B' ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>{row.b}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
