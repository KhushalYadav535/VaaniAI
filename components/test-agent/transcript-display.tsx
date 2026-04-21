'use client'

import { Message } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

interface TranscriptDisplayProps {
  messages: Message[]
}

export function TranscriptDisplay({ messages }: TranscriptDisplayProps) {
  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No messages yet. Start by clicking the microphone.</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {message.role === 'user' ? 'U' : 'A'}
            </div>
            <div
              className={`flex-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block px-4 py-3 rounded-lg max-w-xs lg:max-w-md ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-50 rounded-bl-none'
                }`}
              >
                <p className="break-words">{message.content}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {formatDateTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
