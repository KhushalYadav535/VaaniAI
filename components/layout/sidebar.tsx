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
  X,
  LogOut,
  Megaphone,
  MessageCircle
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'

import { BookOpen } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Zap },
  { name: 'Call Flows', href: '/call-flows', icon: GitBranch },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Phone Numbers', href: '/numbers', icon: Phone },
  { name: 'Call Logs', href: '/logs', icon: History },
  { name: 'Chats', href: '/chats', icon: MessageCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Voice Settings', href: '/voice-settings', icon: Mic },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Test Agent', href: '/test-agent', icon: Microscope },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const initials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

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
        {/* Logo area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-thin text-lg text-foreground tracking-wide">Vaani<span className="font-extralight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI</span></span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-light',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon size={18} className={isActive ? 'text-purple-600 dark:text-purple-400' : ''} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border/50 p-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 text-foreground">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-light truncate text-foreground">{user?.name || 'User'}</div>
              <div className="text-xs text-foreground/60 font-light truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-foreground/40 hover:text-red-500 transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
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
