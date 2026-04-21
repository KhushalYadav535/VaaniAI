'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'

interface ApiKeysSectionProps {
  apiKey: string
  onUpdate: (value: string) => void
}

export function ApiKeysSection({ apiKey, onUpdate }: ApiKeysSectionProps) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskedKey = apiKey.slice(0, 7) + '*'.repeat(Math.max(0, apiKey.length - 14)) + apiKey.slice(-7)

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-2">VoiceAgent API Key</h2>
          <p className="text-slate-400 text-sm">Your primary API key for authenticating requests to the VoiceAgent platform.</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="apiKey" className="text-slate-200">API Key</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="bg-slate-800 border-slate-700 text-slate-50 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-slate-700 text-slate-50 hover:bg-slate-800 gap-2"
            >
              <Copy size={18} />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-50 mb-2">Last Regenerated</h3>
          <p className="text-sm text-slate-400">Jan 15, 2024 at 10:30 AM</p>
        </div>

        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full">
          <RefreshCw size={18} />
          Regenerate Key
        </Button>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-600">
            <strong>Warning:</strong> Regenerating your API key will immediately invalidate the current key. Make sure to update any applications using this key.
          </p>
        </div>
      </div>
    </Card>
  )
}
