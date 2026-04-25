'use client'

import { useRouter } from 'next/navigation'
import { AgentForm } from '@/components/agents/agent-form'
import { ArrowLeft, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateAgentPage() {
  const router = useRouter()

  const handleCreateAgent = async (newAgent: any) => {
    try {
      let tools = []
      if (newAgent.toolsJson) {
        try {
          tools = JSON.parse(newAgent.toolsJson)
        } catch(e) {
           alert("Invalid Tools JSON")
           return
        }
      }
      // @ts-ignore
      const { agentsApi } = await import('@/lib/api')
      
      const payload = {
        ...newAgent,
        tools,
        voice: {
          provider: newAgent.voiceProvider,
          voiceId: newAgent.voiceId || 'en-US-JennyNeural'
        },
        llm: {
          provider: newAgent.llmProvider,
          model: newAgent.llmModel
        },
        workflowId: newAgent.workflowId,
        knowledgeBaseId: newAgent.knowledgeBaseId,
        transferNumber: newAgent.transferNumber,
        voicemailMessage: newAgent.voicemailMessage,
        postCallActions: {
          sendSMS: newAgent.sendSMS,
          sendWhatsApp: newAgent.sendWhatsApp,
          smsTemplate: newAgent.smsTemplate,
          whatsappTemplate: newAgent.whatsappTemplate,
        },
        transferToAgentId: newAgent.transferToAgentId,
        voice: {
          speed: newAgent.voiceSpeed || 1.0,
        },
        advanced: {
          customLlmUrl: newAgent.customLlmUrl,
          interruptionSensitivity: newAgent.interruptionSensitivity,
          backgroundDenoising: newAgent.backgroundDenoising,
          fillerWords: newAgent.fillerWords,
          ambientNoise: newAgent.ambientNoise,
        }
      }
      
      await agentsApi.create(payload)
      router.push('/agents')
    } catch (e) {
      alert("Failed to create agent")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/10 to-violet-500/10 rounded-full blur-3xl opacity-50" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
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
            <span>Agent Builder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-thin tracking-tight text-slate-900 dark:text-white mb-4 flex items-center">
            Create AI Agent <Zap className="ml-4 w-8 h-8 text-yellow-500" fill="currentColor"/>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl">
            Configure the personality, intelligence, and tools for your new automated voice worker. The agent will be available instantly upon creation.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-10 shadow-2xl shadow-purple-500/5 relative">
          {/* Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/5 rounded-[2rem] pointer-events-none" />
          
          <div className="relative">
             <AgentForm onSubmit={handleCreateAgent} />
          </div>
        </div>
        
      </div>
    </div>
  )
}
