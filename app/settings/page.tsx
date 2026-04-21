'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiKeysSection } from '@/components/settings/api-keys-section'
import { LlmKeysSection } from '@/components/settings/llm-keys-section'
import { TtsKeysSection } from '@/components/settings/tts-keys-section'
import { TelephonySection } from '@/components/settings/telephony-section'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    apiKey: 'sk_live_1234567890abcdef',
    openaiKey: '',
    groqKey: '',
    geminiKey: '',
    elevenLabsKey: '',
    plivoAuthId: '',
    plivoToken: '',
  })

  const updateSettings = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Settings</h1>
        <p className="text-slate-400 mt-2">Manage your API keys and platform configuration.</p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-slate-800 data-[state=active]:text-purple-500">
            API Keys
          </TabsTrigger>
          <TabsTrigger value="llm" className="data-[state=active]:bg-slate-800 data-[state=active]:text-purple-500">
            LLM Providers
          </TabsTrigger>
          <TabsTrigger value="tts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-purple-500">
            TTS & Voice
          </TabsTrigger>
          <TabsTrigger value="telephony" className="data-[state=active]:bg-slate-800 data-[state=active]:text-purple-500">
            Telephony
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <ApiKeysSection
            apiKey={settings.apiKey}
            onUpdate={(value) => updateSettings('apiKey', value)}
          />
        </TabsContent>

        <TabsContent value="llm">
          <LlmKeysSection
            openaiKey={settings.openaiKey}
            groqKey={settings.groqKey}
            geminiKey={settings.geminiKey}
            onUpdate={updateSettings}
          />
        </TabsContent>

        <TabsContent value="tts">
          <TtsKeysSection
            elevenLabsKey={settings.elevenLabsKey}
            onUpdate={(value) => updateSettings('elevenLabsKey', value)}
          />
        </TabsContent>

        <TabsContent value="telephony">
          <TelephonySection
            plivoAuthId={settings.plivoAuthId}
            plivoToken={settings.plivoToken}
            onUpdate={updateSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
