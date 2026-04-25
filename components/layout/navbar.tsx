'use client'

import { Bell, Search, Settings, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/components/providers/auth-provider'
import Link from 'next/link'

export function Navbar() {
  const { user, logout } = useAuth()
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:block relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="search"
            placeholder="Search agents, calls..."
            className="pl-10 h-9 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary w-72 rounded-xl font-light text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <ThemeToggle />

        <Link href="/settings">
          <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <Settings size={18} />
          </button>
        </Link>

        {/* User Avatar with dropdown */}
        <div className="relative group">
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110">
            {initials}
          </button>
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-52 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl shadow-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 py-2">
            <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
              <p className="text-sm font-light text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-light truncate">{user?.email}</p>
            </div>
            <Link href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm font-light text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
              <Settings size={14} /> Settings
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-light text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
