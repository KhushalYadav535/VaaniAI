'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  MessageCircle,
  Activity,
  Code,
  Users,
  LibraryBig,
  FlaskConical,
  ClipboardCheck,
  Plug,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'

import { BookOpen } from 'lucide-react'

const customerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Zap },
  { name: 'Agent Templates', href: '/agent-templates', icon: LibraryBig },
  { name: 'CRM & Leads', href: '/crm', icon: Users },
  { name: 'Visitors', href: '/visitors', icon: Users },
  { name: 'Call Flows', href: '/call-flows', icon: GitBranch },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Phone Numbers', href: '/numbers', icon: Phone },
  { name: 'Call Logs', href: '/logs', icon: History },
  { name: 'Chats', href: '/chats', icon: MessageCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Active Calls', href: '/active-calls', icon: Activity },
  { name: 'Voice Settings', href: '/voice-settings', icon: Mic },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook },
  { name: 'Web Widget', href: '/web-widget', icon: Code },
  { name: 'Playground', href: '/playground', icon: FlaskConical },
  { name: 'Test Agent', href: '/test-agent', icon: Microscope },
  { name: 'Test Suites', href: '/test-suites', icon: ClipboardCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const superAdminNavigation = [
  { name: 'Platform Overview', href: '/super-admin', icon: LayoutDashboard },
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
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <Image src="/logo.png" alt="Vocred Logo" width={150} height={50} className="h-10 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
          {(user?.role === 'super_admin' ? superAdminNavigation : customerNavigation).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon size={18} className={isActive ? 'text-violet-600 dark:text-violet-400' : ''} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-slate-900 dark:text-white">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-slate-400 dark:text-slate-600 hover:text-red-500 transition-all duration-200"
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
