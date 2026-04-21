'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Zap, 
  Phone, 
  History, 
  Settings, 
  Microscope,
  BarChart3,
  Mic,
  GitBranch,
  Webhook,
  Menu,
  X 
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Zap },
  { name: 'Phone Numbers', href: '/numbers', icon: Phone },
  { name: 'Call Logs', href: '/logs', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Call Flow', href: '/call-flow', icon: GitBranch },
  { name: 'Voice Settings', href: '/voice-settings', icon: Mic },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Test Agent', href: '/test-agent', icon: Microscope },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-all duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area - Premium */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-border/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap size={20} className="text-primary-foreground" />
          </div>
          <span className="font-light text-lg text-foreground tracking-wide">Voice<span className="font-semibold">Agent</span></span>
        </div>

        {/* Navigation - Premium */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-light',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section - Premium */}
        <div className="border-t border-border/50 p-4">
          <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-primary/10 text-foreground hover:bg-primary/15 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-light truncate">Admin</div>
              <div className="text-xs text-foreground/60 truncate">admin@voiceagent.io</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
