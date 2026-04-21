'use client'

import { Button } from '@/components/ui/button'
import { Plus, Phone, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <Link href="/agents">
        <div className="relative group">
          {/* Hover background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl"></div>
          
          <Button className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-8 py-6 h-auto text-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 rounded-2xl border-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span>Create Agent</span>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="text-sm opacity-80 font-light">Start building your AI assistant</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Button>
        </div>
      </Link>
      
      <Link href="/numbers">
        <div className="relative group">
          {/* Hover background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl"></div>
          
          <Button className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 font-light px-8 py-6 h-auto text-lg shadow-lg shadow-blue-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 hover:border-blue-400/50 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Phone size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span>Buy Number</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-sm opacity-80 font-light">Get your phone number</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Button>
        </div>
      </Link>
    </div>
  )
}
