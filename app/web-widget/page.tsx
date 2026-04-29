'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { agentsApi } from '@/lib/api'
import { Code, Copy, Check, MousePointerClick, Phone, MessageSquare, Paintbrush } from 'lucide-react'

export default function WebWidgetPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [color, setColor] = useState('#8b5cf6')
  const [buttonText, setButtonText] = useState('Talk to AI Support')
  const [position, setPosition] = useState('bottom-right')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    agentsApi.getAll().then(res => {
      setAgents(res.agents || [])
      if (res.agents?.length > 0) setSelectedAgent(res.agents[0]._id)
    }).catch(console.error)
  }, [])

  const embedCode = `<!-- VaaniAI Widget -->
<script>
  window.vaaniConfig = {
    agentId: "${selectedAgent || 'YOUR_AGENT_ID'}",
    color: "${color}",
    text: "${buttonText}",
    position: "${position}"
  };
</script>
<script src="https://your-domain.com/widget.js" async defer></script>`

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Web Widget Builder</h1>
              <p className="text-sm text-slate-500 font-light">Embed your AI voice agent on any website.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6">
            <div>
              <Label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Target Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <SelectValue placeholder="Select an Agent" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                  {agents.map(ag => (
                    <SelectItem key={ag._id} value={ag._id}>{ag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Button Text</Label>
              <Input 
                value={buttonText} 
                onChange={e => setButtonText(e.target.value)} 
                className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Theme Color</Label>
              <div className="flex items-center gap-3 mt-2">
                <input 
                  type="color" 
                  value={color} 
                  onChange={e => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                />
                <Input 
                  value={color} 
                  onChange={e => setColor(e.target.value)} 
                  className="flex-1 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Code Output */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-medium text-white">Embed Code</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyCode}
                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {embedCode}
            </pre>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 h-full min-h-[500px] relative overflow-hidden shadow-sm flex flex-col">
            {/* Fake browser header */}
            <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-4 flex-1 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center px-3 justify-center text-xs text-slate-400 font-mono">
                your-website.com
              </div>
            </div>
            
            {/* Fake website body */}
            <div className="flex-1 p-8 opacity-40 select-none pointer-events-none">
              <div className="w-1/2 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6"></div>
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
              <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
              <div className="w-4/6 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
              <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>

            {/* The Widget Preview */}
            <div 
              className="absolute p-4 flex flex-col items-end gap-4"
              style={{
                bottom: '1rem',
                [position === 'bottom-right' ? 'right' : 'left']: '1rem',
                alignItems: position === 'bottom-right' ? 'flex-end' : 'flex-start'
              }}
            >
              {/* Fake chat window bubble (decorative) */}
              <div className="bg-white dark:bg-slate-800 w-72 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transform scale-95 origin-bottom animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-16 flex items-center px-4" style={{ backgroundColor: color }}>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3 backdrop-blur-md">
                    <Phone className="w-5 h-5 text-white fill-white/20" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">AI Support</h4>
                    <p className="text-white/70 text-xs">Online</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 h-32 flex items-center justify-center">
                  <Button 
                    className="w-full rounded-full h-12 shadow-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: color, color: '#fff' }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Start Voice Call
                  </Button>
                </div>
              </div>

              {/* The Floating Button */}
              <button 
                className="flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl shadow-purple-500/20 text-white font-medium hover:scale-105 transition-transform duration-300"
                style={{ backgroundColor: color }}
              >
                <MessageSquare className="w-5 h-5" />
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
