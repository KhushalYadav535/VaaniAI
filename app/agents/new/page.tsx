'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AgentForm } from '@/components/agents/agent-form'
import { ArrowLeft, Sparkles, Terminal } from 'lucide-react'
import { getTemplateById } from '@/lib/agentTemplates'
import { agentsApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CreateAgentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Compute template data synchronously so the form never mounts with empty defaults
  const templateId = searchParams.get('template')
  const template = templateId ? getTemplateById(templateId) : null

  const templateInfo = template
    ? { name: template.name, category: template.category, description: template.description }
    : null

  const templateDefaults = template
    ? {
        name: template.config.name,
        systemPrompt: template.config.systemPrompt,
        firstMessage: template.config.firstMessage,
        voiceProvider: template.config.voiceProvider,
        voiceId: template.config.voiceId,
        language: template.config.language,
        llmProvider: template.config.llmProvider,
        llmModel: template.config.llmModel,
        temperature: template.config.temperature,
        maxDuration: template.config.maxDuration,
        toolsJson: template.config.toolsJson,
        knowledgeBaseId: template.config.knowledgeBaseId,
        workflowId: template.config.workflowId,
        customLlmUrl: template.config.customLlmUrl,
        transferToAgentId: template.config.transferToAgentId,
        voiceSpeed: template.config.voiceSpeed ?? 1.0,
        interruptionSensitivity: template.config.interruptionSensitivity ?? 0.5,
        backgroundDenoising: template.config.backgroundDenoising ?? 'default',
        fillerWords: template.config.fillerWords ?? false,
        ambientNoise: template.config.ambientNoise ?? 'none',
        transferNumber: template.config.transferNumber ?? '',
        voicemailMessage: template.config.voicemailMessage ?? '',
        sendSMS: template.config.sendSMS ?? false,
        sendWhatsApp: template.config.sendWhatsApp ?? false,
        smsTemplate: template.config.smsTemplate ?? '',
        whatsappTemplate: template.config.whatsappTemplate ?? '',
      }
    : null

  const handleCreateAgent = async (formData: any) => {
    try {
      let tools: any[] = []
      if (formData.toolsJson) {
        try {
          tools = JSON.parse(formData.toolsJson)
        } catch {
          toast.error('Invalid Tools JSON')
          return
        }
      }

      const payload = {
        name: formData.name,
        systemPrompt: formData.systemPrompt,
        firstMessage: formData.firstMessage,
        language: formData.language || 'en',
        temperature: formData.temperature ?? 0.7,
        maxDuration: formData.maxDuration ?? 600,
        tools,
        voice: {
          provider: formData.voiceProvider || 'edge-tts',
          voiceId: formData.voiceId || 'en-US-JennyNeural',
          speed: formData.voiceSpeed ?? 1.0,
        },
        llm: {
          provider: formData.llmProvider || 'groq',
          model: formData.llmModel || 'llama-3.1-8b-instant',
        },
        knowledgeBaseId: formData.knowledgeBaseId || undefined,
        workflowId: formData.workflowId || undefined,
        transferNumber: formData.transferNumber || '',
        transferToAgentId: formData.transferToAgentId || undefined,
        voicemailMessage: formData.voicemailMessage || '',
        postCallActions: {
          sendSMS: formData.sendSMS || false,
          sendWhatsApp: formData.sendWhatsApp || false,
          smsTemplate: formData.smsTemplate || '',
          whatsappTemplate: formData.whatsappTemplate || '',
        },
        advanced: {
          customLlmUrl: formData.customLlmUrl || '',
          interruptionSensitivity: formData.interruptionSensitivity ?? 0.5,
          backgroundDenoising: formData.backgroundDenoising || 'default',
          fillerWords: formData.fillerWords || false,
          ambientNoise: formData.ambientNoise || 'none',
        },
      }

      await agentsApi.create(payload)
      toast.success('Agent created successfully!')
      router.push('/agents')
    } catch (e: any) {
      console.error('Agent creation error:', e)
      toast.error(e?.message || 'Failed to create agent')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 md:p-12 relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
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
            <span>Deployment Terminal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 flex items-center">
            Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500 ml-3">Neural Agent</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl">
            Configure the neural parameters, voice synthesis, and routing logic for your new automated worker.
          </p>
        </div>

        {/* Template Banner */}
        {templateInfo && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-slate-900 dark:text-white">{templateInfo.name}</h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 font-medium">{templateInfo.category}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-light">{templateInfo.description}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">All fields are pre-filled from this template. Edit anything you need, then deploy.</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="w-full">
          <AgentForm 
            key={templateId || 'new-agent'}
            onSubmit={handleCreateAgent} 
            submitLabel={templateDefaults ? "Deploy Template Agent" : "Deploy Agent"}
            defaultValues={templateDefaults}
          />
        </div>
        
      </div>
    </div>
  )
}
