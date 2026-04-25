'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PhoneNumber } from '@/lib/types'
import { MoreVertical, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface NumbersTableProps {
  numbers: PhoneNumber[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<PhoneNumber>) => void
}

export function NumbersTable({ numbers, onDelete, onUpdate }: NumbersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <>
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-md transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Number</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Country</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned Agent</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Monthly Cost</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Created</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {numbers.map((number) => (
                <tr key={number.id} className="border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-800 dark:text-slate-200">{number.number}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{number.country}</td>
                  <td className="py-4 px-6 text-sm">
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-0 flex-none gap-2 font-normal capitalize">
                      {number.type}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-200">
                    {number.assignedAgent ? number.assignedAgent.name : '—'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <Badge className={number.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 border-0 flex-none gap-2 font-normal' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0 flex-none gap-2 font-normal'}>
                      {number.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-200">${(number.monthlyCost / 100).toFixed(2)}</td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{formatDate(number.createdAt)}</td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-50">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DropdownMenuItem className="text-slate-700 dark:text-slate-50 focus:bg-slate-100 dark:focus:bg-slate-800">
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(number.id)}
                          className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {numbers.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
              <MoreVertical className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-light text-sm">No phone numbers purchased yet</p>
          </div>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-50">Delete Phone Number</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this phone number? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel className="border-slate-700 text-slate-50 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
