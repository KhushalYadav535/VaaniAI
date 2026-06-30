'use client'

import { useState, useMemo, useRef } from 'react'
import { X, Search, Play, Pause, Globe, User, Mic, Loader2, ChevronDown } from 'lucide-react'
import { useVoices, VoiceOption } from '@/hooks/useVoices'

// ── Types ─────────────────────────────────────────────────────────────────────
interface VoicePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (voice: VoiceOption & { provider: string; providerName: string }) => void
  selectedVoiceId?: string
}

// ── Language display map ───────────────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = {
  'hi': 'Hindi', 'hi-IN': 'Hindi', 'hi-Latn': 'Hindi (Latin)',
  'en': 'English', 'en-US': 'English (US)', 'en-IN': 'English (India)',
  'en-GB': 'English (UK)', 'en-AU': 'English (AU)',
  'ta': 'Tamil', 'ta-IN': 'Tamil',
  'te': 'Telugu', 'te-IN': 'Telugu',
  'mr': 'Marathi', 'mr-IN': 'Marathi',
  'bn': 'Bengali', 'bn-IN': 'Bengali',
  'gu': 'Gujarati', 'gu-IN': 'Gujarati',
  'kn': 'Kannada', 'kn-IN': 'Kannada',
  'ml': 'Malayalam', 'ml-IN': 'Malayalam',
  'ur': 'Urdu', 'pa': 'Punjabi',
  'fr': 'French', 'fr-FR': 'French',
  'es': 'Spanish', 'es-ES': 'Spanish',
  'de': 'German', 'pt': 'Portuguese',
  'it': 'Italian', 'ja': 'Japanese',
  'ko': 'Korean', 'zh': 'Chinese',
  'ar': 'Arabic', 'ru': 'Russian',
  'multi': 'Multilingual',
}

function getLangLabel(lang: string) {
  return LANG_LABELS[lang] || LANG_LABELS[lang.slice(0, 2)] || lang.toUpperCase()
}

function getLangShort(lang: string) {
  // Extract 2-letter code for compact display
  const parts = lang.split('-')
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
}

// ── Voice Card ─────────────────────────────────────────────────────────────────
interface VoiceCardProps {
  voice: VoiceOption & { provider: string; providerName: string }
  isSelected: boolean
  onUse: () => void
}

function VoiceCard({ voice, isSelected, onUse }: VoiceCardProps) {
  const [playing, setPlaying]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const audioRef                = useRef<HTMLAudioElement | null>(null)

  // Extract accent/style from name (text in parentheses)
  const nameMatch = voice.name.match(/^(.+?)(?:\s*\(([^)]+)\))?$/)
  const baseName  = nameMatch?.[1]?.trim() || voice.name
  const accent    = nameMatch?.[2] || voice.providerName

  const handlePlay = async () => {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    if (voice.preview) {
      setLoading(true)
      const audio = new Audio(voice.preview)
      audioRef.current = audio
      audio.oncanplaythrough = () => { setLoading(false); setPlaying(true); audio.play() }
      audio.onended = () => setPlaying(false)
      audio.onerror = () => { setLoading(false); setPlaying(false) }
      audio.load()
    } else {
      // Trigger backend TTS preview
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/voice-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            text: 'Hello! I am your AI assistant. How can I help you today?',
            voiceId: voice.voiceId,
            speed: 1.0,
          }),
        })
        if (!res.ok) throw new Error('Preview failed')
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended  = () => { setPlaying(false); URL.revokeObjectURL(url) }
        audio.onerror  = () => { setPlaying(false) }
        setPlaying(true)
        audio.play()
      } catch {
        setPlaying(false)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div
      className={`group flex items-center justify-between px-5 py-4 border-b border-[#1e2230] last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer ${
        isSelected ? 'bg-[#00d4c8]/5 border-l-2 border-l-[#00d4c8]' : ''
      }`}
    >
      {/* Left — voice info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-2">
          <span className="text-white font-semibold text-[15px] truncate">{baseName}</span>
          <span className="text-[#aaa] text-xs font-normal flex-shrink-0">( {accent} )</span>
          {isSelected && (
            <span className="text-[10px] px-1.5 py-0.5 bg-[#00d4c8]/20 text-[#00d4c8] rounded font-medium flex-shrink-0">
              Selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-5 text-sm text-[#aaa] flex-wrap">
          <span className="flex items-center gap-1.5">
            <Globe size={13} className="text-[#666]" />
            <span>{getLangShort(voice.lang)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <User size={13} className="text-[#666]" />
            <span>{voice.gender}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Mic size={13} className="text-[#666]" />
            <span>{voice.providerName}</span>
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {/* Play button */}
        <button
          onClick={e => { e.stopPropagation(); handlePlay() }}
          className="w-10 h-10 rounded-full bg-[#00d4c8] hover:bg-[#00bfb4] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          {loading ? (
            <Loader2 size={15} className="text-black animate-spin" />
          ) : playing ? (
            <Pause size={15} className="text-black" />
          ) : (
            <Play size={15} className="text-black ml-0.5" />
          )}
        </button>

        {/* Use button */}
        <button
          onClick={e => { e.stopPropagation(); onUse() }}
          className="px-4 h-10 rounded-lg bg-[#00d4c8] hover:bg-[#00bfb4] text-black font-semibold text-sm transition-all hover:scale-105 active:scale-95"
        >
          Use
        </button>
      </div>
    </div>
  )
}

// ── Custom Select ──────────────────────────────────────────────────────────────
function FilterSelect({
  value, onChange, options, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const label = options.find(o => o.value === value)?.label || placeholder
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 h-11 bg-[#1a1d2e] border border-[#2a2d40] text-slate-300 rounded-lg hover:border-[#00d4c8]/50 transition-colors text-sm whitespace-nowrap min-w-[140px] justify-between"
      >
        {label}
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg shadow-2xl z-20 py-1 min-w-full">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  value === opt.value
                    ? 'text-[#00d4c8] bg-[#00d4c8]/10'
                    : 'text-slate-300 hover:bg-[#0f1117] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export function VoicePickerModal({ open, onClose, onSelect, selectedVoiceId }: VoicePickerModalProps) {
  const { providers, allVoices, loading } = useVoices()

  const [search, setSearch]         = useState('')
  const [genderFilter, setGender]   = useState('all')
  const [langFilter, setLang]       = useState('all')

  // Build unique language options from available voices
  const langOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All Languages' }]
    allVoices.forEach(v => {
      const key = v.lang.split('-')[0]
      if (!seen.has(key)) {
        seen.add(key)
        opts.push({ value: key, label: getLangLabel(v.lang) })
      }
    })
    return opts
  }, [allVoices])

  const genderOptions = [
    { value: 'all',    label: 'All Genders' },
    { value: 'Female', label: 'Female'       },
    { value: 'Male',   label: 'Male'         },
  ]

  const filtered = useMemo(() =>
    allVoices.filter(v => {
      const q = search.toLowerCase()
      const matchSearch  = !q || v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q)
      const matchGender  = genderFilter === 'all' || v.gender === genderFilter
      const matchLang    = langFilter === 'all'   || v.lang.startsWith(langFilter)
      return matchSearch && matchGender && matchLang
    }),
  [allVoices, search, genderFilter, langFilter])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-[#0f1117] border border-[#1e2230] rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2230] flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Select a Voice</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1e2230] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e2230] flex-shrink-0">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or description"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-[#1a1d2e] border border-[#2a2d40] text-white placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:border-[#00d4c8]/50 transition-colors"
            />
          </div>

          <FilterSelect
            value={genderFilter}
            onChange={setGender}
            options={genderOptions}
            placeholder="All Genders"
          />

          <FilterSelect
            value={langFilter}
            onChange={setLang}
            options={langOptions}
            placeholder="All Languages"
          />
        </div>

        {/* ── Voice List ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-[#00d4c8]" />
              <span className="text-sm">Loading voices…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Mic size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No voices match your filters</p>
            </div>
          ) : (
            filtered.map(voice => (
              <VoiceCard
                key={`${voice.provider}-${voice.voiceId}`}
                voice={voice}
                isSelected={voice.voiceId === selectedVoiceId}
                onUse={() => { onSelect(voice); onClose() }}
              />
            ))
          )}
        </div>

        {/* ── Footer count ── */}
        <div className="px-6 py-3 border-t border-[#1e2230] flex-shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {filtered.length} voice{filtered.length !== 1 ? 's' : ''} available
            {providers.length > 0 && ` across ${providers.length} provider${providers.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-3">
            {providers.map(p => (
              <span key={p.id} className="text-[10px] px-2 py-0.5 bg-[#1a1d2e] border border-[#2a2d40] text-slate-400 rounded-full">
                {p.name} · {p.voices.length}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
