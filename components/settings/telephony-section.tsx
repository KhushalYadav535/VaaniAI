'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TelephonySectionProps {
  plivoAuthId: string
  plivoToken: string
  onUpdate: (key: string, value: string) => void
}

export function TelephonySection({
  plivoAuthId,
  plivoToken,
  onUpdate,
}: TelephonySectionProps) {
  const [showToken, setShowToken] = useState(false)

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-50 mb-2">Telephony Provider</h2>
          <p className="text-slate-400 text-sm">Configure your phone provider credentials for making and receiving calls.</p>
        </div>

        <div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-1">Plivo</h3>
            <p className="text-sm text-slate-400 mb-4">Global cloud communications platform for voice calls and SMS.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="plivoAuthId" className="text-slate-200">Auth ID</Label>
              <Input
                id="plivoAuthId"
                type="text"
                value={plivoAuthId}
                onChange={(e) => onUpdate('plivoAuthId', e.target.value)}
                placeholder="MAXXXXXXXXXXXXXXXXXX"
                className="mt-2 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-600"
              />
            </div>

            <div>
              <Label htmlFor="plivoToken" className="text-slate-200">Auth Token</Label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative">
                  <Input
                    id="plivoToken"
                    type={showToken ? 'text' : 'password'}
                    value={plivoToken}
                    onChange={(e) => onUpdate('plivoToken', e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-600 pr-10"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors"
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <a href="https://console.plivo.com/auth/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
                    Dashboard
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>New to Plivo?</strong> Sign up for a free account at <a href="https://console.plivo.com" target="_blank" rel="noopener noreferrer" className="underline">console.plivo.com</a> to get your credentials.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Available Phone Numbers</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-300">+1 (555) 123-4567 <span className="text-slate-500 text-xs">(Active)</span></p>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-300">+1 (800) 555-0123 <span className="text-slate-500 text-xs">(Active)</span></p>
            </div>
          </div>
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
