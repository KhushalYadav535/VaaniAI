'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Users, Mail, Clock, CheckCircle } from 'lucide-react'
import { visitorsApi } from '@/lib/api' // Need to add visitorsApi in lib/api.ts

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVisitors()
  }, [])

  const fetchVisitors = async () => {
    try {
      const data: any = await visitorsApi.getAll()
      if (data.success) {
        setVisitors(data.visitors)
      }
    } catch (error) {
      console.error('Failed to fetch visitors', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-thin text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            Verified Visitors
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light mt-1">
            People who verified their email to test the agent
          </p>
        </div>
      </div>

      {/* Visitors List */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Email</th>
                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Verified At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-light">
                    Loading visitors...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 font-light">
                    No verified visitors found.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => (
                  <tr key={visitor._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {visitor.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-light">
                        <Clock className="w-4 h-4" />
                        {new Date(visitor.updatedAt || visitor.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
