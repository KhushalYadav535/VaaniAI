'use client'

import { Button } from '@/components/ui/button'
import { Mic, Square } from 'lucide-react'

interface MicrophoneButtonProps {
  isListening: boolean
  onClick: () => void
}

export function MicrophoneButton({ isListening, onClick }: MicrophoneButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`w-24 h-24 rounded-full transition-all duration-200 ${
        isListening
          ? 'bg-red-600 hover:bg-red-700 scale-110 shadow-lg shadow-red-500/50'
          : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/50'
      } text-white`}
    >
      {isListening ? (
        <Square size={40} className="fill-white" />
      ) : (
        <Mic size={40} />
      )}
    </Button>
  )
}
