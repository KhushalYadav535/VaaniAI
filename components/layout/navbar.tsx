'use client'

import { Bell, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from './theme-toggle'

export function Navbar() {
  return (
    <header className="h-20 border-b border-border/50 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:block relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="search"
            placeholder="Search agents, calls..."
            className="pl-12 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-primary w-80 rounded-xl font-light"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 relative group">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded-lg bg-foreground text-background text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Notifications</span>
        </button>

        <ThemeToggle />

        <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 group">
          <Settings size={20} />
          <span className="absolute bottom-full right-0 mb-2 px-2 py-1 rounded-lg bg-foreground text-background text-xs font-light opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Settings</span>
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold cursor-pointer hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
          A
        </div>
      </div>
    </header>
  )
}
