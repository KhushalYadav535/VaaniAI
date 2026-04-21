'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { mockAgents } from '@/lib/mock-data'

const buyNumberSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  type: z.enum(['local', 'toll-free']),
  selectedNumber: z.string().min(1, 'Select a number'),
  agentId: z.string().optional(),
})

type BuyNumberData = z.infer<typeof buyNumberSchema>

interface BuyNumberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: BuyNumberData) => void
}

// Mock available numbers by country
const availableNumbersByCountry: Record<string, Record<string, string[]>> = {
  'United States': {
    local: ['+1 (617) 555-0123', '+1 (212) 555-0456', '+1 (415) 555-0789'],
    'toll-free': ['+1 (877) 555-0111', '+1 (888) 555-0222'],
  },
  'United Kingdom': {
    local: ['+44 20 7946 0959', '+44 121 555 0123'],
    'toll-free': ['+44 845 555 0111'],
  },
  Canada: {
    local: ['+1 (416) 555-0123', '+1 (604) 555-0456'],
    'toll-free': ['+1 (833) 555-0111'],
  },
  Australia: {
    local: ['+61 2 5550 0123', '+61 3 5550 0456'],
    'toll-free': ['+61 1800 555 0111'],
  },
}

export function BuyNumberModal({
  open,
  onOpenChange,
  onSubmit,
}: BuyNumberModalProps) {
  const {
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BuyNumberData>({
    resolver: zodResolver(buyNumberSchema),
    defaultValues: {
      type: 'local',
      country: 'United States',
    },
  })

  const country = watch('country')
  const type = watch('type')

  const availableNumbers = availableNumbersByCountry[country]?.[type] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Buy Phone Number</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select a country and available number to purchase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="country" className="text-slate-200">Country</Label>
            <Select
              value={country}
              onValueChange={(value) => {
                setValue('country', value)
                setValue('selectedNumber', '')
              }}
            >
              <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type" className="text-slate-200">Number Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setValue('type', value as 'local' | 'toll-free')
                setValue('selectedNumber', '')
              }}
            >
              <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="toll-free">Toll-Free</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="selectedNumber" className="text-slate-200">Available Numbers</Label>
            <Select
              value={watch('selectedNumber')}
              onValueChange={(value) => setValue('selectedNumber', value)}
            >
              <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue placeholder="Select a number" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {availableNumbers.map((num) => (
                  <SelectItem key={num} value={num}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.selectedNumber.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="agentId" className="text-slate-200">Assign to Agent (Optional)</Label>
            <Select
              value={watch('agentId') || ''}
              onValueChange={(value) => setValue('agentId', value || undefined)}
            >
              <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                <SelectValue placeholder="No agent selected" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="">No agent</SelectItem>
                {mockAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-700 text-slate-50 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
              Buy Number
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
