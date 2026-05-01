'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AgentForm } from '@/components/agents/agent-form'
import { agentsApi } from '@/lib/api'
import { ArrowLeft, Edit2, Code2, Copy, CheckCircle2, Terminal } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 md:p-12 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Abort & Return
        </button>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4 font-mono text-xs tracking-wider uppercase">
            <Terminal className="w-3.5 h-3.5" />
            <span>Agent Reconfiguration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 flex items-center gap-4">
            Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">Neural Agent</span>
            <Edit2 className="w-8 h-8 text-cyan-600 dark:text-cyan-500" />
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl">
              Update parameters for <span className="text-cyan-600 dark:text-cyan-400 font-medium">{agent?.name || '...'}</span>.
              Changes are deployed instantly to the live neural network.
            </p>
            
            {/* Embed Widget Button */}
            {agent && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl px-6 shadow-lg shadow-cyan-500/5 transition-all">
                    <Code2 className="w-4 h-4 mr-2" />
                    Embed Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-cyan-600 dark:text-cyan-400">Embed Voice Agent</DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Copy and paste this script into your website's HTML to add a floating voice assistant widget.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-slate-50 dark:bg-black/50 rounded-xl overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 relative group">
                    <pre className="text-sm font-mono text-emerald-600 dark:text-green-400">
{`<script 
  src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/widget.js" 
  data-agent-id="${agent._id}"
  data-color="#06b6d4"
  data-position="bottom-right"
></script>`}
                    </pre>
                    <button 
                      onClick={() => {
                        const code = `<script \n  src="${window.location.origin}/widget.js" \n  data-agent-id="${agent._id}"\n  data-color="#06b6d4"\n  data-position="bottom-right"\n></script>`;
                        navigator.clipboard.writeText(code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute top-3 right-3 p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-cyan-600 dark:text-cyan-400 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 font-light">
                    Place this script anywhere within your <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-cyan-600 dark:text-cyan-400">&lt;body&gt;</code> tag. The widget will automatically initialize.
                  </p>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full">
          {loading ? (
            <div className="text-center py-20 text-cyan-500/50 font-mono animate-pulse">Initializing neural link...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-mono">{error}</div>
          ) : agent ? (
            <AgentForm
              onSubmit={handleUpdateAgent}
              submitLabel="Save & Deploy"
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
  )
}
