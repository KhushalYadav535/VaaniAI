'use client'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { AgentForm } from './agent-form'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CreateAgentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function CreateAgentDrawer({
  open,
  onOpenChange,
  onSubmit,
}: CreateAgentDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-900 border-slate-800">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-slate-50">Create New Agent</DrawerTitle>
              <DrawerDescription className="text-slate-400">
                Set up a new AI voice agent for your platform.
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-50">
                <X size={20} />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <AgentForm onSubmit={onSubmit} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
