'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { callFlowsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Network, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CallFlowsPage() {
  const router = useRouter()
  const [flows, setFlows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlows()
  }, [])

  const fetchFlows = async () => {
    try {
      const res = await callFlowsApi.getAll()
      setFlows(res.flows || [])
    } catch (err: any) {
      toast.error('Failed to fetch call flows')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const newFlow = {
        name: 'New Call Flow',
        description: 'A visual conversation flow.',
        nodes: [
          { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Start Call' } }
        ],
        edges: []
      }
      const res = await callFlowsApi.create(newFlow)
      router.push(`/call-flows/${res.flow._id}`)
    } catch (err: any) {
      toast.error('Failed to create flow')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this flow?')) return
    try {
      await callFlowsApi.delete(id)
      toast.success('Flow deleted')
      fetchFlows()
    } catch (err: any) {
      toast.error('Failed to delete flow')
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-8 h-8 text-purple-600" />
              Visual Call Flows
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Design advanced conversational workflows using a drag-and-drop node builder.
            </p>
          </div>
          
          <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Create Flow
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading workflows...</div>
        ) : flows.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Network className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No flows created yet</h3>
            <p className="text-slate-500 mb-6">Start building your first stateful AI conversation.</p>
            <Button onClick={handleCreate} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              Build Workflow
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {flows.map(flow => (
              <Card 
                key={flow._id} 
                onClick={() => router.push(`/call-flows/${flow._id}`)}
                className="cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 transition-all border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm group"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="group-hover:text-purple-600 transition-colors">{flow.name}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={(e) => handleDelete(flow._id, e)} className="text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">{flow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{flow.nodes?.length || 0} nodes</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
