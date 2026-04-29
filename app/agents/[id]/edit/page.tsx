'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AgentForm } from '@/components/agents/agent-form'
import { agentsApi } from '@/lib/api'
import { ArrowLeft, Sparkles, Edit2, Code2, Copy, CheckCircle2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!agentId) return
    agentsApi.getById(agentId)
      .then((res: any) => {
        setAgent(res.agent)
      })
      .catch(() => setError('Failed to load agent'))
      .finally(() => setLoading(false))
  }, [agentId])

  const handleUpdateAgent = async (formData: any) => {
    try {
      let tools = []
      if (formData.toolsJson) {
        try {
          tools = JSON.parse(formData.toolsJson)
        } catch (e) {
          alert('Invalid Tools JSON')
          return
        }
      }

      await agentsApi.update(agentId, {
        name: formData.name,
        systemPrompt: formData.systemPrompt,
        firstMessage: formData.firstMessage,
        language: formData.language || 'en',
        temperature: formData.temperature,
        maxDuration: formData.maxDuration,
        voice: {
          provider: formData.voiceProvider,
          voiceId: formData.voiceId || agent?.voice?.voiceId || 'en-US-JennyNeural',
          speed: formData.voiceSpeed,
        },
        llm: {
          provider: formData.llmProvider,
          model: formData.llmModel,
        },
        tools,
        workflowId: formData.workflowId,
        knowledgeBaseId: formData.knowledgeBaseId,
        transferNumber: formData.transferNumber,
        voicemailMessage: formData.voicemailMessage,
        postCallActions: {
          sendSMS: formData.sendSMS,
          sendWhatsApp: formData.sendWhatsApp,
          smsTemplate: formData.smsTemplate,
          whatsappTemplate: formData.whatsappTemplate,
        },
        advanced: {
          customLlmUrl: formData.customLlmUrl,
          interruptionSensitivity: formData.interruptionSensitivity,
          backgroundDenoising: formData.backgroundDenoising,
          fillerWords: formData.fillerWords,
          ambientNoise: formData.ambientNoise,
        }
      })
      router.push('/agents')
    } catch (e) {
      alert('Failed to update agent')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 to-violet-500/10 rounded-full blur-3xl opacity-50" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-light text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Agents
        </button>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 mb-6 font-medium text-xs tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agent Editor</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-slate-900 dark:text-white mb-4 flex items-center gap-4">
            Edit Agent <Edit2 className="w-8 h-8 text-purple-500" />
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl">
              Update the configuration for <span className="text-purple-600 dark:text-purple-400 font-medium">{agent?.name || '...'}</span>.
              Changes take effect immediately on the next call.
            </p>
            
            {/* Embed Widget Button */}
            {agent && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-full px-6 font-light shadow-lg">
                    <Code2 className="w-4 h-4 mr-2" />
                    Embed Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Embed Voice Agent</DialogTitle>
                    <DialogDescription>
                      Copy and paste this script into your website's HTML to add a floating voice assistant widget.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-slate-900 dark:bg-black rounded-xl overflow-x-auto my-4 border border-slate-800 relative group">
                    <pre className="text-sm font-mono text-green-400">
{`<script 
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget.js" 
  data-agent-id="${agent._id}"
  data-color="#8b5cf6"
  data-position="bottom-right"
></script>`}
                    </pre>
                    <button 
                      onClick={() => {
                        const code = `<script \n  src="${window.location.origin}/widget.js" \n  data-agent-id="${agent._id}"\n  data-color="#8b5cf6"\n  data-position="bottom-right"\n></script>`;
                        navigator.clipboard.writeText(code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 font-light">
                    Place this script anywhere within your <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">&lt;body&gt;</code> tag. The widget will automatically appear on your site.
                  </p>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-10 shadow-2xl shadow-purple-500/5 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 rounded-[2rem] pointer-events-none" />
          <div className="relative">
            {loading ? (
              <div className="text-center py-16 text-slate-500 font-light">Loading agent data...</div>
            ) : error ? (
              <div className="text-center py-16 text-red-500 font-light">{error}</div>
            ) : agent ? (
              <AgentForm
                onSubmit={handleUpdateAgent}
                submitLabel="Save Changes"
                defaultValues={{
                  name: agent.name,
                  systemPrompt: agent.systemPrompt,
                  firstMessage: agent.firstMessage,
                  language: agent.language || 'en',
                  voiceProvider: agent.voice?.provider || 'edge-tts',
                  voiceId: agent.voice?.voiceId || 'en-US-JennyNeural',
                  llmProvider: agent.llm?.provider || 'groq',
                  llmModel: agent.llm?.model || 'llama-3.1-8b-instant',
                  temperature: agent.temperature ?? 0.7,
                  maxDuration: agent.maxDuration ?? 600,
                  toolsJson: agent.tools?.length > 0 ? JSON.stringify(agent.tools, null, 2) : '',
                  customLlmUrl: agent.advanced?.customLlmUrl || '',
                  transferToAgentId: agent.transferToAgentId || undefined,
                  workflowId: agent.workflowId || undefined,
                  knowledgeBaseId: agent.knowledgeBaseId || undefined,
                  transferNumber: agent.transferNumber || '',
                  voicemailMessage: agent.voicemailMessage || '',
                  sendSMS: agent.postCallActions?.sendSMS || false,
                  sendWhatsApp: agent.postCallActions?.sendWhatsApp || false,
                  smsTemplate: agent.postCallActions?.smsTemplate || '',
                  whatsappTemplate: agent.postCallActions?.whatsappTemplate || '',
                  voiceSpeed: agent.voice?.speed || 1.0,
                  interruptionSensitivity: agent.advanced?.interruptionSensitivity ?? 0.5,
                  backgroundDenoising: agent.advanced?.backgroundDenoising || 'default',
                  fillerWords: agent.advanced?.fillerWords || false,
                  ambientNoise: agent.advanced?.ambientNoise || 'none',
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
