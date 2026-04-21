'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  firstMessage: z.string().min(1, 'First message is required'),
  voiceProvider: z.string(),
  llmProvider: z.string(),
  llmModel: z.string(),
  temperature: z.number().min(0).max(1),
  maxDuration: z.number().min(1),
})

type AgentFormData = z.infer<typeof agentFormSchema>

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void
}

export function AgentForm({ onSubmit }: AgentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      temperature: 0.7,
      maxDuration: 600,
      voiceProvider: 'eleven-labs',
      llmProvider: 'openai',
      llmModel: 'gpt-4-turbo',
    },
  })

  const temperature = watch('temperature')
  const llmProvider = watch('llmProvider')

  const llmModels: Record<string, string[]> = {
    openai: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    groq: ['mixtral-8x7b-32768', 'llama-2-70b-chat'],
    gemini: ['gemini-1.5-pro', 'gemini-1.0-pro'],
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name" className="text-slate-200">Agent Name</Label>
        <Input
          id="name"
          placeholder="e.g., Customer Support Bot"
          {...register('name')}
          className="mt-2 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-purple-600"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="systemPrompt" className="text-slate-200">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          placeholder="Define the agent's behavior and personality..."
          {...register('systemPrompt')}
          className="mt-2 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-purple-600 min-h-24"
        />
        {errors.systemPrompt && <p className="text-red-500 text-sm mt-1">{errors.systemPrompt.message}</p>}
      </div>

      <div>
        <Label htmlFor="firstMessage" className="text-slate-200">First Message</Label>
        <Input
          id="firstMessage"
          placeholder="What should the agent say first?"
          {...register('firstMessage')}
          className="mt-2 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-purple-600"
        />
        {errors.firstMessage && <p className="text-red-500 text-sm mt-1">{errors.firstMessage.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="voiceProvider" className="text-slate-200">Voice Provider</Label>
          <Select {...register('voiceProvider')}>
            <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="eleven-labs">ElevenLabs</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="azure">Azure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="llmProvider" className="text-slate-200">LLM Provider</Label>
          <Select
            value={llmProvider}
            onValueChange={(value) => {
              setValue('llmProvider', value)
              setValue('llmModel', llmModels[value][0])
            }}
          >
            <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="llmModel" className="text-slate-200">LLM Model</Label>
        <Select {...register('llmModel')}>
          <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            {llmModels[llmProvider]?.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature" className="text-slate-200">Temperature: {temperature.toFixed(2)}</Label>
          <span className="text-xs text-slate-500">Creativity (0 = precise, 1 = creative)</span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(value) => setValue('temperature', value[0])}
          min={0}
          max={1}
          step={0.01}
          className="mt-4"
        />
      </div>

      <div>
        <Label htmlFor="maxDuration" className="text-slate-200">Max Call Duration (seconds)</Label>
        <Input
          id="maxDuration"
          type="number"
          {...register('maxDuration', { valueAsNumber: true })}
          className="mt-2 bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 focus:border-purple-600"
        />
        {errors.maxDuration && <p className="text-red-500 text-sm mt-1">{errors.maxDuration.message}</p>}
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
        Create Agent
      </Button>
    </form>
  )
}
