'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { settingsApi } from '@/lib/api'
import {
  Check, X, Eye, EyeOff, Key, Cpu, Mic,
  Phone, Settings, Loader2, ExternalLink
} from 'lucide-react'

interface SettingsState {
  groqKey: string
  openaiKey: string
  geminiKey: string
  deepgramKey: string
  elevenLabsKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
  preferredLlm: string
  preferredTts: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    groqKey: '', openaiKey: '', geminiKey: '',
    deepgramKey: '', elevenLabsKey: '',
    twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '',
    preferredLlm: 'groq', preferredTts: 'edge-tts',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState('llm')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data: any = await settingsApi.get()
      setSettings(prev => ({ ...prev, ...data.settings }))
    } catch (e) {
      console.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await settingsApi.update(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const testKey = async (type: 'groq' | 'deepgram') => {
    setTesting(type)
    setTestResults(prev => ({ ...prev, [type]: null }))
    try {
      if (type === 'groq') {
        await settingsApi.testGroq(settings.groqKey)
      } else {
        await settingsApi.testDeepgram(settings.deepgramKey)
      }
      setTestResults(prev => ({ ...prev, [type]: true }))
    } catch {
      setTestResults(prev => ({ ...prev, [type]: false }))
    } finally {
      setTesting(null)
    }
  }

  const update = (key: keyof SettingsState, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const toggleShow = (key: string) =>
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))

  const tabs = [
    { id: 'llm', label: 'LLM Providers', icon: Cpu },
    { id: 'stt', label: 'Speech (STT)', icon: Mic },
    { id: 'tts', label: 'Voice (TTS)', icon: Settings },
    { id: 'telephony', label: 'Telephony', icon: Phone },
  ]

  const KeyInput = ({ label, keyName, placeholder, helpText, freeTag, link, testable }: {
    label: string; keyName: keyof SettingsState; placeholder: string;
    helpText?: string; freeTag?: string; link?: string; testable?: 'groq' | 'deepgram'
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-light text-slate-700 dark:text-slate-300">{label}</label>
          {freeTag && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200/50 font-light">
              {freeTag}
            </span>
          )}
        </div>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-light">
            Get API Key <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type={showKeys[keyName] ? 'text' : 'password'}
            placeholder={placeholder}
            value={settings[keyName]}
            onChange={e => update(keyName, e.target.value)}
            className="pl-10 pr-10 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-light text-sm"
          />
          <button onClick={() => toggleShow(keyName)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showKeys[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {testable && (
          <Button variant="outline" size="sm"
            onClick={() => testKey(testable)}
            disabled={!settings[keyName] || testing === testable}
            className="h-10 px-3 rounded-2xl border-slate-200/50 dark:border-slate-700/50 text-xs font-light"
          >
            {testing === testable ? <Loader2 className="w-4 h-4 animate-spin" /> :
              testResults[testable] === true ? <Check className="w-4 h-4 text-green-500" /> :
              testResults[testable] === false ? <X className="w-4 h-4 text-red-500" /> : 'Test'}
          </Button>
        )}
      </div>
      {helpText && <p className="text-xs font-light text-slate-500 dark:text-slate-400">{helpText}</p>}
      {testResults[testable!] === true && (
        <p className="text-xs text-green-600 dark:text-green-400 font-light flex items-center gap-1"><Check className="w-3 h-3" /> Valid key!</p>
      )}
      {testResults[testable!] === false && (
        <p className="text-xs text-red-600 dark:text-red-400 font-light flex items-center gap-1"><X className="w-3 h-3" /> Invalid key</p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-pink-600/5 rounded-3xl blur-xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-thin text-slate-900 dark:text-white">Settings</h1>
                <p className="text-sm text-slate-500 font-light">Manage your API keys & configuration</p>
              </div>
            </div>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-light rounded-2xl px-6 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> :
               saved ? <Check className="w-4 h-4 mr-2 text-green-300" /> : null}
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-1.5">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-light transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 space-y-6">
          
          {activeTab === 'llm' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">LLM Providers</h2>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                <p className="text-sm font-light text-green-700 dark:text-green-400">
                  🎉 <strong>Groq is recommended</strong> — Free tier, super fast (llama3, mixtral). 
                  Sign up at <a href="https://console.groq.com" target="_blank" className="underline">console.groq.com</a>
                </p>
              </div>
              <KeyInput label="Groq API Key" keyName="groqKey" placeholder="gsk_..." freeTag="FREE ✓"
                helpText="Uses llama3-8b-8192 by default. Fast & free." link="https://console.groq.com" testable="groq" />
              <KeyInput label="OpenAI API Key" keyName="openaiKey" placeholder="sk-..." helpText="Optional. For GPT-4 models." link="https://platform.openai.com" />
              <KeyInput label="Gemini API Key" keyName="geminiKey" placeholder="AIza..." helpText="Optional. Google AI models." link="https://aistudio.google.com" />
            </>
          )}

          {activeTab === 'stt' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Mic className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Speech-to-Text (STT)</h2>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm font-light text-blue-700 dark:text-blue-400">
                  🎙️ <strong>Deepgram</strong> — $200 free credits on signup. Real-time streaming, ultra-low latency.
                  Sign up at <a href="https://deepgram.com" target="_blank" className="underline">deepgram.com</a>
                </p>
              </div>
              <KeyInput label="Deepgram API Key" keyName="deepgramKey" placeholder="..." freeTag="$200 FREE"
                helpText="Used for real-time voice transcription in Test Agent." link="https://deepgram.com" testable="deepgram" />
            </>
          )}

          {activeTab === 'tts' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Text-to-Voice (TTS)</h2>
              </div>
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
                <p className="text-sm font-light text-green-700 dark:text-green-400">
                  🔊 <strong>Edge TTS is FREE</strong> — Uses Microsoft&apos;s Neural voices. No API key needed! 
                  30+ natural voices including Hindi.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/30 dark:border-slate-700/30">
                <p className="text-sm font-light text-slate-700 dark:text-slate-300 mb-1">Default TTS Provider</p>
                <p className="text-xs font-light text-slate-500">Edge TTS (Free Microsoft Neural voices) — No setup needed</p>
              </div>
              <KeyInput label="ElevenLabs API Key" keyName="elevenLabsKey" placeholder="..." freeTag="10k chars/mo"
                helpText="Optional. Premium quality voices. 10k chars/month free." link="https://elevenlabs.io" />
            </>
          )}

          {activeTab === 'telephony' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-thin text-slate-900 dark:text-white">Telephony (Phone Calls)</h2>
              </div>
              <div className="p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-800/50">
                <p className="text-sm font-light text-yellow-700 dark:text-yellow-400">
                  📞 <strong>Twilio free trial</strong> — Sign up at <a href="https://twilio.com" target="_blank" className="underline">twilio.com</a>. 
                  Free trial includes credits for 1 phone number and test calls to verified numbers.
                </p>
              </div>
              <KeyInput label="Twilio Account SID" keyName="twilioAccountSid" placeholder="ACxxx..." helpText="Found in your Twilio Console dashboard." link="https://console.twilio.com" />
              <KeyInput label="Twilio Auth Token" keyName="twilioAuthToken" placeholder="..." helpText="Found in your Twilio Console dashboard." />
              <div className="space-y-2">
                <label className="text-sm font-light text-slate-700 dark:text-slate-300">Twilio Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="+1234567890"
                    value={settings.twilioPhoneNumber}
                    onChange={e => update('twilioPhoneNumber', e.target.value)}
                    className="pl-10 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 rounded-2xl font-light text-sm"
                  />
                </div>
                <p className="text-xs font-light text-slate-500">Your Twilio phone number in E.164 format</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
