'use client'

import { useState, useEffect } from 'react'
import { voicesApi } from '@/lib/api'

export interface VoiceOption {
  voiceId:  string
  name:     string
  lang:     string
  gender:   string
  preview?: string | null
}

export interface VoiceProvider {
  id:     string
  name:   string
  voices: VoiceOption[]
}

export function useVoices() {
  const [providers, setProviders] = useState<VoiceProvider[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    voicesApi.getAll()
      .then((res: any) => {
        setProviders(res.providers || [])
      })
      .catch((err: any) => {
        console.error('[useVoices]', err)
        setError(err.message || 'Failed to load voices')
        // Fallback — provide at least Edge TTS voices so the form still works
        setProviders([{
          id:   'edge-tts',
          name: 'Edge TTS (Free)',
          voices: [
            { voiceId: 'hi-IN-SwaraNeural',   name: 'Swara (Hindi - Female)',           lang: 'hi-IN', gender: 'Female' },
            { voiceId: 'hi-IN-MadhurNeural',  name: 'Madhur (Hindi - Male)',             lang: 'hi-IN', gender: 'Male'   },
            { voiceId: 'en-IN-NeerjaNeural',  name: 'Neerja (English India - Female)',   lang: 'en-IN', gender: 'Female' },
            { voiceId: 'en-IN-PrabhatNeural', name: 'Prabhat (English India - Male)',    lang: 'en-IN', gender: 'Male'   },
            { voiceId: 'en-US-JennyNeural',   name: 'Jenny (English US - Female)',       lang: 'en-US', gender: 'Female' },
            { voiceId: 'en-US-GuyNeural',     name: 'Guy (English US - Male)',           lang: 'en-US', gender: 'Male'   },
            { voiceId: 'en-GB-SoniaNeural',   name: 'Sonia (English UK - Female)',       lang: 'en-GB', gender: 'Female' },
          ],
        }])
      })
      .finally(() => setLoading(false))
  }, [])

  /** All voices from all providers flattened */
  const allVoices = providers.flatMap(p =>
    p.voices.map(v => ({ ...v, provider: p.id, providerName: p.name }))
  )

  return { providers, allVoices, loading, error }
}
