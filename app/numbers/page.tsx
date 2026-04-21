'use client'

import { useState } from 'react'
import { NumbersTable } from '@/components/numbers/numbers-table'
import { BuyNumberModal } from '@/components/numbers/buy-number-modal'
import { mockPhoneNumbers } from '@/lib/mock-data'
import { mockAgents } from '@/lib/mock-data'
import { PhoneNumber } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>(mockPhoneNumbers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isBuyOpen, setIsBuyOpen] = useState(false)

  const filteredNumbers = numbers.filter(number =>
    number.number.includes(searchQuery) || number.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBuyNumber = (data: any) => {
    const newNumber: PhoneNumber = {
      id: String(numbers.length + 1),
      number: data.selectedNumber,
      country: data.country,
      type: data.type,
      assignedAgent: data.agentId ? {
        id: data.agentId,
        name: mockAgents.find(a => a.id === data.agentId)?.name || '',
      } : undefined,
      status: 'active',
      monthlyCost: data.type === 'toll-free' ? 1500 : 1000,
      createdAt: new Date(),
    }
    setNumbers([...numbers, newNumber])
    setIsBuyOpen(false)
  }

  const handleDeleteNumber = (id: string) => {
    setNumbers(numbers.filter(n => n.id !== id))
  }

  const handleUpdateNumber = (id: string, updates: Partial<PhoneNumber>) => {
    setNumbers(numbers.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Phone Numbers</h1>
          <p className="text-slate-400 mt-2">Manage and purchase phone numbers for your agents.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <Input
              type="search"
              placeholder="Search by number or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800 text-slate-50 placeholder:text-slate-500 focus:border-purple-600"
            />
          </div>
          <Button
            onClick={() => setIsBuyOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2 whitespace-nowrap"
          >
            <Plus size={20} />
            Buy Number
          </Button>
        </div>
      </div>

      <NumbersTable
        numbers={filteredNumbers}
        onDelete={handleDeleteNumber}
        onUpdate={handleUpdateNumber}
      />

      <BuyNumberModal
        open={isBuyOpen}
        onOpenChange={setIsBuyOpen}
        onSubmit={handleBuyNumber}
      />
    </div>
  )
}
