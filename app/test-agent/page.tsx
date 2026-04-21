'use client'

import { useState } from 'react'
import { AgentSelector } from '@/components/test-agent/agent-selector'
import { MicrophoneButton } from '@/components/test-agent/microphone-button'
import { TranscriptDisplay } from '@/components/test-agent/transcript-display'
import { ConnectionStatus } from '@/components/test-agent/connection-status'
import { mockAgents } from '@/lib/mock-data'
import { Message } from '@/lib/types'

export default function TestAgentPage() {
  const [selectedAgentId, setSelectedAgentId] = useState(mockAgents[0].id)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: mockAgents[0].firstMessage,
      timestamp: new Date(),
    },
  ])
  const [isListening, setIsListening] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'listening'>('idle')

  const selectedAgent = mockAgents.find(a => a.id === selectedAgentId)

  const handleMicrophoneClick = () => {
    if (!isListening) {
      setIsListening(true)
      setConnectionStatus('listening')

      // Simulate voice input and agent response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'user',
            content: 'Hi, I need help with my account.',
            timestamp: new Date(),
          },
        ])
        setConnectionStatus('connected')
      }, 1500)

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "Of course! I'd be happy to help. What seems to be the issue with your account?",
            timestamp: new Date(),
          },
        ])
        setIsListening(false)
        setConnectionStatus('idle')
      }, 3000)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: selectedAgent?.firstMessage || 'Hello!',
        timestamp: new Date(),
      },
    ])
    setConnectionStatus('idle')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Test Agent</h1>
        <p className="text-slate-400 mt-2">Test your agents before deploying to production.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onSelect={setSelectedAgentId}
            onReset={handleReset}
          />
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
            {/* Transcript area */}
            <div className="flex-1 overflow-y-auto p-6">
              <TranscriptDisplay messages={messages} />
            </div>

            {/* Input area */}
            <div className="border-t border-slate-800 p-6 bg-slate-900/30">
              <div className="flex flex-col items-center gap-6">
                <MicrophoneButton
                  isListening={isListening}
                  onClick={handleMicrophoneClick}
                />
                <div className="text-center">
                  <p className="text-slate-400 text-sm">
                    {isListening ? 'Listening...' : 'Click the microphone to start talking'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
