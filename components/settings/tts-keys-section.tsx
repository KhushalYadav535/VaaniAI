'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TtsKeysSectionProps {
  elevenLabsKey: string
  onUpdate: (value: string) => void
}

export function TtsKeysSection({ elevenLabsKey, onUpdate }: TtsKeysSectionProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-2">Text-to-Speech & Voice Providers</h2>
          <p className="text-slate-400 text-sm">Configure providers for natural-sounding voice output from your agents.</p>
        </div>

        <div className="border-b border-slate-800 pb-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-1">ElevenLabs</h3>
            <p className="text-sm text-slate-400 mb-4">High-quality, realistic voice synthesis with multiple languages and accents.</p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="elevenLabsKey" className="text-slate-200">API Key</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="elevenLabsKey"
                  type={showKey ? 'text' : 'password'}
                  value={elevenLabsKey}
                  onChange={(e) => onUpdate(e.target.value)}
                  placeholder="xi-..."
                  className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-600 pr-10"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <a href="https://elevenlabs.io/app/api-keys" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
                  Get Key
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-800/30 rounded-lg text-sm text-slate-300">
            <strong>Tip:</strong> ElevenLabs offers 10,000 free characters per month. Visit their console to manage voice settings and models.
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-50 mb-1">Google Cloud Text-to-Speech</h3>
          <p className="text-sm text-slate-400 mb-4">Coming soon - support for Google Cloud TTS providers.</p>
          <Button variant="outline" disabled className="border-slate-700 text-slate-400">
            Not yet available
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex gap-4">
          <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
            Cancel
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  )
}
