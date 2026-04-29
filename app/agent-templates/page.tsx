'use client'

import { useRouter } from 'next/navigation'
import { LibraryBig, ShoppingCart, Users, Briefcase, HeartPulse, Building2, Ticket, Car, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AgentTemplatesPage() {
  const router = useRouter()

  const categories = ['All', 'Sales', 'Support', 'Healthcare', 'Real Estate', 'Logistics']

  const templates = [
    {
      id: 'sales-lead',
      title: 'Sales Lead Generation',
      category: 'Sales',
      description: 'Outbound agent that qualifies leads, collects budgets, and books sales calls.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Most Popular',
      features: ['Budget Collection', 'Calendar Booking', 'CRM Sync']
    },
    {
      id: 'service-request',
      title: 'Customer Service Request',
      category: 'Support',
      description: 'Handles incoming complaints, generates ticket IDs, and escalates to human agents.',
      icon: Ticket,
      color: 'from-indigo-500 to-purple-500',
      badge: 'Essential',
      features: ['Ticket Creation', 'Human Escalation', 'Sentiment Analysis']
    },
    {
      id: 'appointment-setter',
      title: 'Clinic Appointment Setter',
      category: 'Healthcare',
      description: 'Empathetic agent to book, reschedule, or cancel doctor appointments.',
      icon: HeartPulse,
      color: 'from-rose-500 to-pink-500',
      features: ['Empathetic Voice', 'Slot Checking', 'Reminders']
    },
    {
      id: 'real-estate',
      title: 'Real Estate Assistant',
      category: 'Real Estate',
      description: 'Answers property queries, schedules site visits, and captures buyer requirements.',
      icon: Building2,
      color: 'from-emerald-500 to-teal-500',
      features: ['Property FAQs', 'Site Visit Booking', 'Lead Capture']
    },
    {
      id: 'ecommerce',
      title: 'E-commerce Order Tracker',
      category: 'Sales',
      description: 'Provides live updates on order status and handles return requests.',
      icon: ShoppingCart,
      color: 'from-orange-500 to-amber-500',
      features: ['API Webhooks', 'Return Processing', 'Order Tracking']
    },
    {
      id: 'logistics',
      title: 'Logistics Dispatcher',
      category: 'Logistics',
      description: 'Coordinates with drivers, updates delivery times, and handles delays.',
      icon: Car,
      color: 'from-slate-600 to-slate-800',
      features: ['Driver Coordination', 'Delay Alerts', 'Status Updates']
    }
  ]

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-3xl blur-xl" />
        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20">
            <LibraryBig className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-thin text-slate-900 dark:text-white mb-2">Agent Templates</h1>
          <p className="text-slate-500 font-light max-w-xl mx-auto">
            Deploy pre-configured AI voice agents in seconds. Designed for specific industries with built-in prompt engineering and function calling.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center justify-center gap-2 flex-wrap pb-4">
        {categories.map((cat, i) => (
          <button
            key={i}
            className={`px-5 py-2 rounded-full text-sm font-light transition-all ${
              i === 0 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' 
                : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div 
            key={template.id} 
            className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 flex flex-col"
          >
            {template.badge && (
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                {template.badge}
              </div>
            )}
            
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <template.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-light">
                  {template.category}
                </Badge>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-tight">
                  {template.title}
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 font-light leading-relaxed mb-6 flex-1">
              {template.description}
            </p>
            
            <div className="space-y-2 mb-6">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Included Features</p>
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature, i) => (
                  <div key={i} className="text-xs px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-purple-600 dark:hover:bg-purple-500 text-white dark:text-slate-900 hover:text-white transition-colors duration-300 rounded-xl group-hover:shadow-lg group-hover:shadow-purple-500/20"
              onClick={() => router.push(`/agents/new?template=${template.id}`)}
            >
              Use Template <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
