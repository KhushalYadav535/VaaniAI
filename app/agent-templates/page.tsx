'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LibraryBig, ShoppingCart, Users, Briefcase, HeartPulse, Building2, Ticket, Car, ArrowRight, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { agentTemplates, getAllCategories, getTemplatesByCategory, AgentTemplate } from '@/lib/agentTemplates'
import { agentsApi } from '@/lib/api'

const iconMap = {
  Users,
  Ticket,
  HeartPulse,
  Building2,
  ShoppingCart,
  Car
}

export default function AgentTemplatesPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [deploying, setDeploying] = useState<string | null>(null)

  const categories = ['All', ...getAllCategories()]
  
  const filteredTemplates = selectedCategory === 'All' 
    ? agentTemplates 
    : getTemplatesByCategory(selectedCategory)

  const deployTemplateAgent = async (template: AgentTemplate) => {
    setDeploying(template.id)
    
    try {
      let tools: any[] = []
      if (template.config.toolsJson) {
        try { tools = JSON.parse(template.config.toolsJson) } catch {}
      }
      
      const payload = {
        name: template.config.name,
        systemPrompt: template.config.systemPrompt,
        firstMessage: template.config.firstMessage,
        language: template.config.language || 'en',
        temperature: template.config.temperature ?? 0.7,
        maxDuration: template.config.maxDuration ?? 600,
        tools,
        voice: {
          provider: template.config.voiceProvider || 'edge-tts',
          voiceId: template.config.voiceId || 'en-US-JennyNeural',
          speed: template.config.voiceSpeed ?? 1.0,
        },
        llm: {
          provider: template.config.llmProvider || 'groq',
          model: template.config.llmModel || 'llama-3.1-8b-instant',
        },
        transferNumber: template.config.transferNumber || '',
        voicemailMessage: template.config.voicemailMessage || '',
        postCallActions: {
          sendSMS: template.config.sendSMS || false,
          sendWhatsApp: template.config.sendWhatsApp || false,
          smsTemplate: template.config.smsTemplate || '',
          whatsappTemplate: template.config.whatsappTemplate || '',
        },
        advanced: {
          interruptionSensitivity: template.config.interruptionSensitivity ?? 0.5,
          backgroundDenoising: template.config.backgroundDenoising || 'default',
          fillerWords: template.config.fillerWords || false,
          ambientNoise: template.config.ambientNoise || 'none',
        },
      }
      
      await agentsApi.create(payload)
      toast.success(`"${template.name}" agent deployed successfully!`)
      router.push('/agents')
      
    } catch (error: any) {
      console.error('Failed to deploy agent:', error)
      toast.error(error?.message || `Failed to deploy "${template.name}" agent.`)
    } finally {
      setDeploying(null)
    }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20">
            <LibraryBig className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-thin text-slate-900 dark:text-white mb-2">Agent Templates</h1>
          <p className="text-slate-500 font-light max-w-xl mx-auto">
            One-click deployment of pre-configured AI voice agents. Industry-optimized with professional prompts and tools ready to go.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Pre-filled Forms
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
              Fully Customizable
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">
              Production Ready
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-center gap-2 flex-wrap pb-4">
        {categories.map((cat, i: number) => (
          <button
            key={i}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-light transition-all ${
              selectedCategory === cat 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' 
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.map((template: AgentTemplate) => {
          const IconComponent = iconMap[template.icon as keyof typeof iconMap]
          return (
            <div 
              key={template.id} 
              className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 flex flex-col"
            >
              {template.badge && (
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  {template.badge}
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-light">
                    {template.category}
                  </Badge>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-tight">
                    {template.name}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 font-light leading-relaxed mb-6 flex-1">
                {template.description}
              </p>
              
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Included Features</p>
                <div className="flex flex-wrap gap-2">
                  {template.features.map((feature: string, i: number) => (
                    <div key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 transition-all duration-300 rounded-xl group-hover:shadow-lg group-hover:shadow-purple-500/20 font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                  onClick={() => router.push(`/agents/new?template=${template.id}`)}
                >
                  Use Template <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button 
                  variant="outline"
                  className="px-4 py-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => deployTemplateAgent(template)}
                  disabled={deploying === template.id}
                  title="Quick deploy without editing"
                >
                  {deploying === template.id ? (
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
