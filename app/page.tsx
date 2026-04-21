'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Zap, BarChart3, Shield, Sparkles, Star, ChevronRight, Play, Globe, Users, Award } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-violet-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-thin tracking-wide text-slate-900 dark:text-white">
              Voice<span className="font-extralight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Agent</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" className="font-light text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-6 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-200/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 dark:border-purple-800/50">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-light text-slate-700 dark:text-slate-300">Next-Generation AI Voice Solutions</span>
            <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>

          <div className="space-y-6">
            <h1 className="text-7xl md:text-8xl font-thin tracking-tight text-slate-900 dark:text-white leading-tight">
              <span className="block">Elevate Your</span>
              <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-extralight">Customer Voice</span>
              <span className="block">Experience</span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              Deploy intelligent, enterprise-grade voice agents that understand context, handle complexity, and deliver exceptional results. 
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-light"> Premium technology meets refined simplicity.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-10 h-14 text-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105">
                Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="font-light px-10 h-14 text-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 pt-12">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-light text-slate-600 dark:text-slate-400">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-light text-slate-600 dark:text-slate-400">10,000+ Businesses</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-light text-slate-600 dark:text-slate-400">150+ Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-thin text-slate-900 dark:text-white mb-4">
              Premium <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Features</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">Crafted for excellence and designed for impact</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: 'Ultra-Fast', desc: 'Millisecond response times with cutting-edge AI', color: 'from-yellow-500 to-orange-500' },
              { icon: BarChart3, title: 'Intelligence', desc: 'Advanced analytics suite with deep insights', color: 'from-blue-500 to-cyan-500' },
              { icon: Shield, title: 'Enterprise', desc: 'Bank-level security with SOC2 compliance', color: 'from-green-500 to-emerald-500' },
              { icon: Phone, title: 'Seamless', desc: 'Universal integration across all platforms', color: 'from-purple-500 to-pink-500' },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-purple-400/50 hover:bg-gradient-to-br hover:from-white/80 hover:to-purple-50/80 dark:hover:from-slate-900/80 dark:hover:to-purple-950/80 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-105"
              >
                <div className={`mb-6 p-4 rounded-2xl bg-gradient-to-br ${feature.color} w-fit group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-light text-xl text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '99.9%', label: 'Uptime', desc: 'Enterprise reliability' },
              { number: '<100ms', label: 'Latency', desc: 'Lightning fast response' },
              { number: '1M+', label: 'Calls Daily', desc: 'Processing power' },
              { number: '24/7', label: 'Support', desc: 'Always here for you' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-thin bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-light text-slate-900 dark:text-white mb-1">{stat.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-light">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Testimonials */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-thin text-slate-900 dark:text-white mb-4">
              Trusted by <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Industry Leaders</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light">See what our customers are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Chen', role: 'CEO at TechCorp', content: 'VoiceAgent transformed our customer support. Response times improved by 80% and customer satisfaction is at an all-time high.', rating: 5 },
              { name: 'Michael Rodriguez', role: 'CTO at StartupX', content: 'The AI capabilities are incredible. Our agents handle complex queries with human-like understanding.', rating: 5 },
              { name: 'Emily Watson', role: 'Head of CX at Enterprise', content: 'Best investment we made this year. The ROI is undeniable and our customers love the experience.', rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-light mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-light text-slate-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-light">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-pink-600/10 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-pink-600/5 backdrop-blur-sm"></div>
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative p-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/20 to-pink-600/20 border border-purple-400/30 mb-6">
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-light text-purple-700 dark:text-purple-300">Limited Time Offer</span>
              </div>
              
              <h2 className="text-5xl font-thin text-slate-900 dark:text-white mb-6">
                Ready to <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Revolutionize</span> Your Customer Experience?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-light mb-10 max-w-2xl mx-auto">
                Join thousands of industry leaders using VoiceAgent to deliver world-class customer experiences. 
                Start with our premium trial and see the difference.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light px-12 h-14 text-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105">
                    Begin Your Excellence <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="font-light px-12 h-14 text-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-thin tracking-wide text-slate-900 dark:text-white">
                  Voice<span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent font-extralight">Agent</span>
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
                Premium AI voice solutions for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-light text-slate-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-light">
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-light text-slate-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-light">
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-light text-slate-900 dark:text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-light">
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light">
              &copy; 2024 VoiceAgent. Crafted with precision and excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
