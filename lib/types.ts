export interface Agent {
  id: string
  name: string
  systemPrompt: string
  firstMessage: string
  voice: {
    provider: 'eleven-labs' | 'google' | 'azure'
    voiceId: string
  }
  llm: {
    provider: 'openai' | 'groq' | 'gemini'
    model: string
  }
  temperature: number
  maxDuration: number
  status: 'active' | 'inactive'
  createdAt: Date
  callsCount: number
  totalMinutes: number
}

export interface PhoneNumber {
  id: string
  number: string
  country: string
  type: 'local' | 'toll-free'
  assignedAgent?: {
    id: string
    name: string
  }
  status: 'active' | 'inactive'
  monthlyCost: number
  createdAt: Date
}

export interface CallLog {
  id: string
  agentId: string
  agentName: string
  fromNumber: string
  toNumber: string
  direction: 'inbound' | 'outbound'
  duration: number // seconds
  status: 'completed' | 'failed' | 'ongoing'
  transcript?: string
  recordingUrl?: string
  startTime: Date
  endTime: Date
  costCents: number
}

export interface CallTranscript {
  id: string
  callId: string
  messages: Message[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UserSettings {
  apiKey: string
  openaiKey?: string
  groqKey?: string
  geminiKey?: string
  elevenLabsKey?: string
  plivoAuthId?: string
  plivoToken?: string
}

export interface TestSession {
  agentId: string
  status: 'idle' | 'connected' | 'listening' | 'processing'
  messages: Message[]
}
