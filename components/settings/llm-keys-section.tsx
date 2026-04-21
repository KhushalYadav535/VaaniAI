'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface LlmKeysSectionProps {
  openaiKey: string
  groqKey: string
  geminiKey: string
  onUpdate: (key: string, value: string) => void
}

export function LlmKeysSection({
  openaiKey,
  groqKey,
  geminiKey,
  onUpdate,
}: LlmKeysSectionProps) {
  const [showKeys, setShowKeys] = useState({
    openai: false,
    groq: false,
    gemini: false,
  })

  const providers = [
    {
      name: 'OpenAI',
      key: 'openaiKey',
      value: openaiKey,
      placeholder: 'sk-...',
      description: 'GPT-4, GPT-3.5-turbo, and other OpenAI models',
      docs: 'https://platform.openai.com/api-keys',
    },
    {
      name: 'Groq',
      key: 'groqKey',
      value: groqKey,
      placeholder: 'gsk_...',
      description: 'Mixtral, Llama, and other open-source models',
      docs: 'https://console.groq.com',
    },
    {
      name: 'Google Gemini',
      key: 'geminiKey',
      value: geminiKey,
      placeholder: 'AIza...',
      description: 'Google Gemini models and vision capabilities',
      docs: 'https://ai.google.dev',
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h2 className="text-xl font-bold text-slate-50 mb-6">Large Language Models (LLM)</h2>
        <p className="text-slate-400 text-sm mb-6">Add API keys for different LLM providers. Your agents will use these for conversations and decision-making.</p>

        <div className="space-y-8">
          {providers.map((provider) => (
            <div key={provider.key} className="border-b border-slate-800 last:border-0 pb-8 last:pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">{provider.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{provider.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor={provider.key} className="text-slate-200">API Key</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id={provider.key}
                      type={showKeys[provider.key as keyof typeof showKeys] ? 'text' : 'password'}
                      value={provider.value}
                      onChange={(e) => onUpdate(provider.key, e.target.value)}
                      placeholder={provider.placeholder}
                      className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-600 pr-10"
                    />
                    <button
                      onClick={() => setShowKeys(prev => ({
                        ...prev,
                        [provider.key]: !prev[provider.key as keyof typeof prev]
                      }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors"
                    >
                      {showKeys[provider.key as keyof typeof showKeys] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <a href={provider.docs} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
                      Docs
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex gap-4">
          <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
            Cancel
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  )
}
