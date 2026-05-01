'use client'

import { Plus, Phone, Sparkles, ArrowRight, Mic, GitBranch } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      label: 'Create Agent',
      desc: 'Build your AI assistant',
      href: '/agents',
      icon: Plus,
      iconBg: 'bg-violet-100 dark:bg-violet-500/15',
      iconColor: 'text-violet-600 dark:text-violet-400',
      borderColor: 'border-violet-200/60 dark:border-violet-500/15',
      hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-500/25',
      hoverShadow: 'hover:shadow-violet-100/50 dark:hover:shadow-violet-500/5',
      badge: <Sparkles className="w-3 h-3 text-amber-500" />,
    },
    {
      label: 'Buy Number',
      desc: 'Get a phone number',
      href: '/numbers',
      icon: Phone,
      iconBg: 'bg-blue-100 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200/60 dark:border-blue-500/15',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/25',
      hoverShadow: 'hover:shadow-blue-100/50 dark:hover:shadow-blue-500/5',
    },
    {
      label: 'Test Agent',
      desc: 'Live voice test',
      href: '/test-agent',
      icon: Mic,
      iconBg: 'bg-pink-100 dark:bg-pink-500/15',
      iconColor: 'text-pink-600 dark:text-pink-400',
      borderColor: 'border-pink-200/60 dark:border-pink-500/15',
      hoverBorder: 'hover:border-pink-300 dark:hover:border-pink-500/25',
      hoverShadow: 'hover:shadow-pink-100/50 dark:hover:shadow-pink-500/5',
    },
    {
      label: 'Call Flows',
      desc: 'Visual flow builder',
      href: '/call-flows',
      icon: GitBranch,
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200/60 dark:border-emerald-500/15',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/25',
      hoverShadow: 'hover:shadow-emerald-100/50 dark:hover:shadow-emerald-500/5',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map(action => {
        const Icon = action.icon
        return (
          <Link key={action.href} href={action.href}
            className={`group relative rounded-2xl border ${action.borderColor} ${action.hoverBorder} bg-white/80 dark:bg-white/[0.02] backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-lg ${action.hoverShadow} hover:-translate-y-0.5`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              {action.badge && action.badge}
            </div>
            <div className="text-[13px] font-semibold text-slate-800 dark:text-white/90 mb-0.5">{action.label}</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500">{action.desc}</div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 absolute bottom-4 right-4 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
        )
      })}
    </div>
  )
}
