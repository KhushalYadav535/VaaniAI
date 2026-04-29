'use client'

import { useState, useEffect } from 'react'
import { NumbersTable } from '@/components/numbers/numbers-table'
import { BuyNumberModal } from '@/components/numbers/buy-number-modal'
import { numbersApi } from '@/lib/api'
import { PhoneNumber } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isBuyOpen, setIsBuyOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNumbers()
  }, [])

  const fetchNumbers = async () => {
    try {
      const res: any = await numbersApi.getAll()
      if (res && res.numbers) {
        // Map backend format to frontend format
        const formatted = res.numbers.map((n: any) => ({
          ...n,
          id: n._id,
          assignedAgent: n.assignedAgent ? {
            id: n.assignedAgent._id,
            name: n.assignedAgent.name,
          } : undefined
        }))
        setNumbers(formatted)
      }
    } catch (e) {
      console.error('Failed to fetch numbers', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredNumbers = numbers.filter(number =>
    number.number.includes(searchQuery) || number.country.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBuyNumber = async (data: any) => {
    try {
      await numbersApi.create({
        number: data.selectedNumber,
        country: data.country,
        type: data.type,
        provider: 'twilio',
        monthlyCost: data.type === 'toll-free' ? 1500 : 1000,
      })
      if (data.agentId) {
        // We need the ID of the newly created number. Fetching all is easiest.
        await fetchNumbers()
        const latestNum: any = await numbersApi.getAll()
        const newNum = latestNum.numbers.find((n: any) => n.number === data.selectedNumber)
        if (newNum) {
          await numbersApi.assignAgent(newNum._id, data.agentId)
        }
      }
      await fetchNumbers()
      setIsBuyOpen(false)
    } catch (e) {
      alert('Failed to purchase number')
    }
  }

  const handleDeleteNumber = async (id: string) => {
    try {
      await numbersApi.delete(id)
      await fetchNumbers()
    } catch (e) {
      alert('Failed to delete number')
    }
  }

  const handleUpdateNumber = async (id: string, updates: Partial<PhoneNumber>) => {
    try {
      if ('assignedAgent' in updates) {
        await numbersApi.assignAgent(id, updates.assignedAgent?.id || null)
      } else {
        await numbersApi.update(id, updates)
      }
      await fetchNumbers()
    } catch (e) {
      alert('Failed to update number')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Phone Numbers</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-light">Manage and purchase phone numbers for your agents.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <Input
              type="search"
              placeholder="Search by number or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-500 dark:focus:border-purple-600 rounded-2xl transition-colors font-light"
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
