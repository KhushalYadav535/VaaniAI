'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Zap, BarChart3, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              VoiceAgent
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-purple-600 hover:bg-purple-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            AI-Powered Voice Agents for{' '}
            <span className="bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              Your Business
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and deploy intelligent voice agents that handle customer interactions 24/7.
            Simple, powerful, and built for scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 gap-2">
                Start Building <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Sub-second response times' },
              { icon: BarChart3, title: 'Analytics', desc: 'Real-time call insights' },
              { icon: Shield, title: 'Secure', desc: 'Enterprise-grade security' },
              { icon: Phone, title: 'Multi-Channel', desc: 'Support all platforms' },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <feature.icon className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600/10 to-purple-400/10 dark:from-purple-600/20 dark:to-purple-400/20 rounded-2xl p-12 text-center border border-purple-600/20">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Ready to transform your customer interactions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of businesses using VoiceAgent to automate their voice communication.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Create Your First Agent Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-50 dark:bg-slate-900/50 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 VoiceAgent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
