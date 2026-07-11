export interface Agent {
  id: string
  _id?: string
  name: string
  systemPrompt: string
  firstMessage: string
  voice: {
    provider: 'eleven-labs' | 'google' | 'azure' | 'edge-tts'
    voiceId: string
  }
  llm: {
    provider: 'openai' | 'groq' | 'gemini'
    model: string
  }
  language?: string
  temperature: number
  maxDuration: number
  status: 'active' | 'inactive'
  isPublic?: boolean
  createdAt: Date
  callsCount: number
  totalMinutes: number
  // P0 Features
  voicemailMessage?: string
  transferNumber?: string
  transferConditions?: {
    onNegativeSentiment: boolean
    onKeyPhrases: string[]
    maxFailedAttempts: number
  }
  postCallActions?: {
    sendSMS: boolean
    sendWhatsApp: boolean
    smsTemplate: string
    whatsappTemplate: string
  }
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

export interface SentimentEntry {
  timestamp: Date
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  text: string
}

export interface NotificationRecord {
  channel: 'sms' | 'whatsapp' | 'email'
  to: string
  sentAt: Date
  status: 'sent' | 'failed' | 'pending'
  messageSid?: string
}

export interface CallLog {
  id: string
  _id?: string
  agentId: string
  agentName: string
  fromNumber: string
  toNumber: string
  direction: 'inbound' | 'outbound' | 'web'
  duration: number // seconds
  status: 'completed' | 'failed' | 'ongoing' | 'no-answer' | 'ringing' | 'answered'
  transcript?: any[]
  recordingUrl?: string
  startTime: Date
  endTime: Date
  costCents: number
  // Enhanced Analysis
  summary?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  emotion?: string
  topics?: string[]
  decisions?: string[]
  customerIntent?: string
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical'
  followUpRequired?: boolean
  actionItems?: string[]
  extractedData?: Record<string, any>
  // AMD
  answeredBy?: 'human' | 'machine' | 'fax' | 'unknown'
  endReason?: string
  // Live Sentiment
  liveSentimentTimeline?: SentimentEntry[]
  // Notifications
  notificationsSent?: NotificationRecord[]
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
  deepgramKey?: string
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
  twilioWhatsAppNumber?: string
  preferredLlm?: string
  preferredTts?: string
}

export interface TestSession {
  agentId: string
  status: 'idle' | 'connected' | 'listening' | 'processing'
  messages: Message[]
}
