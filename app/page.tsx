'use client'

import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import {
  ArrowRight, Mic, Zap, Phone, BarChart3, Shield, Play, Globe, Cpu,
  Waves, Bot, ChevronRight, Star, Sparkles, Headphones, Activity, Lock,
  Infinity, Layers, Network, Orbit, Scan,
} from 'lucide-react'
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { SpotlightCard } from '@/components/ui/spotlight-card'

// ── Easing ──
const ease = [0.16, 1, 0.3, 1] as const
const easeOutExpo = [0.19, 1, 0.22, 1] as const

// ── Reusable animation presets ──
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease, delay },
})

const fadeUpInView = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease, delay },
})

const staggerInView = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7, ease, delay },
})

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animated = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - start) / 2500, 1)
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * value))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [value])
  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

function GlowLine() {
  return (
    <div className="relative w-full h-px overflow-hidden">
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#a78bfa]/50 to-transparent"
      />
      <div className="absolute inset-0 bg-white/[0.03]" />
    </div>
  )
}

function ParticleField({ count = 30 }: { count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%` }}
          animate={{
            opacity: [0, 0.5 + Math.random() * 0.5, 0],
            y: [`${Math.random() * 100}%`, `${-10 + Math.random() * -40}%`],
            x: [`${Math.random() * 100}%`, `${(Math.random() - 0.5) * 60}%`],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'easeOut',
          }}
          className="absolute rounded-full"
          style={{
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
            background: ['#a78bfa', '#818cf8', '#60a5fa', '#c084fc', '#f472b6'][i % 5],
            boxShadow: `0 0 8px ${['#a78bfa', '#818cf8', '#60a5fa', '#c084fc', '#f472b6'][i % 5]}60`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

function SceneDivider({ label }: { label?: string }) {
  return (
    <div className="relative py-16 flex items-center justify-center">
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      {label && (
        <span className="relative px-6 py-2 rounded-full border border-white/[0.06] bg-[#030305]/80 backdrop-blur-xl text-[10px] text-white/30 font-semibold tracking-[0.25em] uppercase">
          {label}
        </span>
      )}
    </div>
  )
}

// ── Cinematic Lens Flare ──
function LensFlare() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 20, damping: 25 })
  const smoothY = useSpring(mouseY, { stiffness: 20, damping: 25 })

  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [mouseX, mouseY])

  return (
    <>
      <motion.div
        style={{ x: smoothX, y: smoothY }}
        className="fixed top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.05)_0%,transparent_65%)]"
      />
      <motion.div
        style={{ x: useTransform(smoothX, v => v * -0.03), y: useTransform(smoothY, v => v * -0.03) }}
        className="fixed top-[20%] right-[10%] w-[300px] h-[2px] pointer-events-none z-0 rotate-[30deg] bg-gradient-to-r from-transparent via-[#a78bfa]/10 to-transparent blur-[4px]"
      />
      <motion.div
        style={{ x: useTransform(smoothX, v => v * 0.02), y: useTransform(smoothY, v => v * 0.02) }}
        className="fixed top-[60%] left-[5%] w-[200px] h-[1px] pointer-events-none z-0 rotate-[-20deg] bg-gradient-to-r from-transparent via-[#60a5fa]/8 to-transparent blur-[3px]"
      />
    </>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Vocred Voice AI Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    description: 'Build and deploy conversational AI voice agents and automate outbound sales calls. The most configurable Voice API for developers.',
    url: 'https://vocred.com',
  }

  // Always call all hooks unconditionally — before any early return
  const { scrollYProgress } = useScroll(
    mounted ? { target: heroRef, offset: ['start start', 'end start'] } : {}
  )
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const heroO = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])
  const gridOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  // ── Mouse 3D Parallax ──
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMX = useSpring(mouseX, { stiffness: 30, damping: 25 })
  const smoothMY = useSpring(mouseY, { stiffness: 30, damping: 25 })

  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX / window.innerWidth - 0.5); mouseY.set(e.clientY / window.innerHeight - 0.5) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [mouseX, mouseY])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const t = setInterval(() => setActiveTab(p => (p + 1) % 3), 4000)
    return () => clearInterval(t)
  }, [])

  if (!mounted) return <div className="min-h-screen bg-[#030305]" />

  const tabs = [
    { label: 'Voice Agent', icon: Headphones, color: '#a78bfa', lines: [
      { w: 'AI', t: "Hi, I'm Vocred. How can I help you today?" },
      { w: 'U', t: 'I need to reschedule my appointment to Friday.' },
      { w: 'AI', t: "Done! I've moved your booking to Friday 3 PM. You'll get a confirmation SMS shortly." },
    ]},
    { label: 'Live Analytics', icon: Activity, color: '#60a5fa', lines: [
      { w: 'S', t: 'Sentiment: Positive (0.87) | Intent: Reschedule' },
      { w: 'S', t: 'QA Score: 96/100 | E2E Latency: 180ms' },
      { w: 'S', t: 'Tools Called: calendar_update, send_sms' },
    ]},
    { label: 'Auto Actions', icon: Zap, color: '#f472b6', lines: [
      { w: 'S', t: 'Google Calendar updated: Friday 3:00 PM' },
      { w: 'S', t: 'SMS confirmation sent to +91-98XXXXXX' },
      { w: 'S', t: 'CRM record synced via webhook (200 OK)' },
    ]},
  ]

  const features = [
    { icon: Zap,       title: 'Sub-400ms Latency',      desc: 'Full-duplex audio pipeline with intelligent VAD barge-in. Zero awkward silences.', accent: '#a78bfa', sub: 'Real-time' },
    { icon: Cpu,       title: 'Model Agnostic',          desc: 'Plug in Groq, OpenAI, Gemini, or any custom endpoint. Switch in one click.', accent: '#60a5fa', sub: 'Flexible' },
    { icon: Mic,       title: 'Multilingual STT',        desc: 'Hindi, Hinglish, English and 30+ languages via Deepgram Nova-2 with auto-detect.', accent: '#22d3ee', sub: 'Global' },
    { icon: Bot,       title: 'Visual Workflow Engine',   desc: 'Drag-and-drop call flow designer. Build complex IVR systems with zero code.', accent: '#f472b6', sub: 'Visual' },
    { icon: Globe,     title: 'Webhooks & Integrations', desc: 'Auto-push transcripts, sentiment & structured data to n8n, Zapier, or your API.', accent: '#fbbf24', sub: 'Connected' },
    { icon: BarChart3, title: 'Deep Analytics',          desc: 'QA scoring, sentiment timelines, call recordings and automatic CRM population.', accent: '#34d399', sub: 'Insights' },
    { icon: Shield,    title: 'Enterprise Security',     desc: 'Role-based access control, team invites, API key encryption, per-org data isolation.', accent: '#c084fc', sub: 'Secure' },
    { icon: Phone,     title: 'Native Telephony',        desc: 'Buy numbers, run outbound campaigns, handle inbound calls — all from one dashboard.', accent: '#f87171', sub: 'Telephony' },
    { icon: Waves,     title: 'Smart Interruption',      desc: 'Agent listens while speaking. Natural human-like barge-in and turn-taking.', accent: '#2dd4bf', sub: 'Natural' },
  ]

  const stats = [
    { num: 400, prefix: '<', suffix: 'ms', label: 'E2E Voice Latency', accent: '#a78bfa' },
    { num: 30, suffix: '+', label: 'Native Languages', accent: '#60a5fa' },
    { num: 99, suffix: '.99%', label: 'Infrastructure Uptime', accent: '#34d399' },
    { num: 10, suffix: 'x', label: 'Cost Reduction', accent: '#f472b6' },
  ]

  return (
    <div
      ref={scrollRef}
      className="min-h-screen bg-[#030305] text-white overflow-x-hidden selection:bg-[#a78bfa]/30"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Script id="schema-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LensFlare />

      {/* ── Cinematic Ambient Canvas ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_15%,transparent_100%)]" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#a78bfa]/[0.04] blur-[200px]"
        />
        <motion.div
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[60%] left-[30%] w-[600px] h-[600px] rounded-full bg-[#60a5fa]/[0.03] blur-[160px]"
        />
      </div>

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, easeOutExpo }}
        className="fixed top-0 w-full z-50 bg-[#030305]/70 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="h-[72px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="Vocred Logo" width={150} height={50} className="h-10 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {['Product', 'Developers', 'Pricing', 'Company'].map(l => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="px-4 py-2 text-[14px] text-white/30 font-medium hover:text-white/80 rounded-lg hover:bg-white/[0.04] transition-all duration-300 tracking-wide"
                >
                  {l}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden sm:block text-[14px] font-medium text-white/30 hover:text-white/80 px-4 py-2 rounded-lg hover:bg-white/[0.04] transition-all tracking-wide"
              >
                Log in
              </Link>
              <Link href="/auth/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#030305] text-[14px] font-semibold hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-shadow cursor-pointer"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          </div>
          <GlowLine />
        </div>
      </motion.nav>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 1: HERO — Cinematic 3D Storytelling
         ════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center text-center px-6 pt-[120px] pb-10 overflow-hidden"
      >
        {/* ── Scrolling Ambient Layers ── */}
        <motion.div style={{ y: heroY, opacity: heroO }} className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-transparent to-[#030305]" />
          {/* Parallax depth layer 1 */}
          <motion.div
            style={{ y: parallaxY, scale: parallaxScale }}
            className="absolute inset-0"
          >
            <div className="absolute top-[15%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#a78bfa]/[0.03] blur-[120px]" />
            <div className="absolute top-[40%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#60a5fa]/[0.02] blur-[150px]" />
            <div className="absolute bottom-[20%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#c084fc]/[0.02] blur-[100px]" />
          </motion.div>
          {/* Animated grid lines */}
          <motion.div
            style={{ opacity: gridOpacity }}
            className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_30%,transparent_100%)]"
          />
        </motion.div>

        {/* ── Hero Content ── */}
        <motion.div
          style={{ y: heroY, opacity: heroO, scale: heroScale }}
          className="relative z-20 max-w-[1000px] mt-8"
        >
          {/* Cinematic Badge */}
          <motion.div {...fadeUp(0.1)}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-3 px-1 py-1 pr-5 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-[13px] text-white/50 mb-8 font-medium shadow-[0_0_40px_rgba(167,139,250,0.08)] hover:border-white/[0.12] transition-all cursor-default group"
            >
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#a78bfa]/20 to-[#60a5fa]/20 text-[#a78bfa] text-[12px] font-semibold">
                <Sparkles className="w-3 h-3" /> NEW
              </span>
              <span className="tracking-wide">Vocred Engine 2.0 — Sub-400ms Full-Duplex Voice</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          </motion.div>

          {/* Cinematic Headline — 3D layered text */}
          <motion.div {...fadeUp(0.2)} className="mb-6 relative">
            {/* Shadow layer for depth */}
            <h1 className="absolute inset-0 text-[48px] sm:text-[64px] md:text-[80px] lg:text-[100px] font-black tracking-[-0.04em] leading-[0.88] text-[#030305] blur-[2px] translate-y-[2px] select-none" aria-hidden>
              <span className="block">The voice</span>
              <span className="block text-transparent">infrastructure</span>
              <span className="block text-transparent">for AI agents.</span>
            </h1>
            <h1 className="relative text-[48px] sm:text-[64px] md:text-[80px] lg:text-[100px] font-black tracking-[-0.04em] leading-[0.88]">
              <span className="block">The voice</span>
              <span className="block bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent pb-1">
                infrastructure
              </span>
              <span className="block bg-gradient-to-b from-white/95 via-white/70 to-white/20 bg-clip-text text-transparent">
                for AI agents.
              </span>
            </h1>
          </motion.div>

          {/* Cinematic subtitle with typewriter feel */}
          <motion.div {...fadeUp(0.3)}>
            <p className="text-[17px] md:text-[19px] text-white/30 max-w-[560px] mx-auto mb-10 leading-[1.8] font-light tracking-wide">
              Deploy enterprise-grade AI voice agents in minutes.
              <br />
              <span className="text-white/40">Ultra-low latency. Any LLM. Any language. Native telephony.</span>
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div {...fadeUp(0.35)} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group relative flex items-center gap-2.5 px-8 py-4 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white rounded-full" />
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#60a5fa]" />
                <span className="relative text-[#030305] group-hover:text-white transition-colors duration-700 font-bold text-[15px] tracking-wide flex items-center gap-2.5">
                  Start building for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15] text-[15px] text-white/60 hover:text-white/80 font-medium transition-all duration-500 backdrop-blur-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="tracking-wide">Watch demo</span>
            </motion.button>
          </motion.div>
          <motion.p {...fadeUp(0.4)} className="text-[13px] text-white/15 font-medium tracking-wider mb-14">
            100 free minutes · No credit card · Deploy in &lt;5 min
          </motion.p>
        </motion.div>

        {/* ── 3D ORBITAL SPHERE — Enhanced Cinematic Version ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 1.4, easeOutExpo }}
          className="relative z-10 w-[400px] h-[400px] sm:w-[480px] sm:h-[480px] md:w-[580px] md:h-[580px] flex-shrink-0"
        >
          {/* Deep outer glow */}
          <div className="absolute inset-[-30%] rounded-full bg-[#a78bfa]/[0.06] blur-[140px]" />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-[-15%] rounded-full bg-[#60a5fa]/[0.04] blur-[100px]"
          />

          {/* Expanding wave rings */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={`wr-${i}`}
              animate={{ scale: [0.2, 1.2], opacity: [0.4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
              className="absolute inset-0 rounded-full border border-[#a78bfa]/20"
            />
          ))}

          {/* 3D Orbital Ring System */}
          <div style={{ perspective: '1000px' }} className="absolute inset-0">
            {/* Ring 1 — Outer, slow */}
            <motion.div
              animate={{ rotateX: [75, 75], rotateY: [0, 360] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-0 rounded-full border-[2px] border-[#a78bfa]/20 shadow-[0_0_60px_rgba(167,139,250,0.08)]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <OrbitLabel rotateX={-75} rotateY={360} duration={22} label="STT" color="#60a5fa" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <OrbitLabel rotateX={-75} rotateY={360} duration={22} label="LLM" color="#a78bfa" />
              </div>
            </motion.div>

            {/* Ring 2 — Mid, reverse */}
            <motion.div
              animate={{ rotateX: [-70, -70], rotateY: [360, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-[5%] rounded-full border-[1.5px] border-[#f472b6]/15 shadow-[0_0_40px_rgba(244,114,182,0.06)]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <OrbitLabel rotateX={70} rotateY={0} duration={28} label="TTS" color="#f472b6" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <OrbitLabel rotateX={70} rotateY={0} duration={28} label="RAG" color="#34d399" />
              </div>
            </motion.div>

            {/* Ring 3 — Fast inner */}
            <motion.div
              animate={{ rotateX: [25, 25], rotateY: [0, -360] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-[15%] rounded-full border-[1px] border-white/[0.06]"
            />
          </div>

          {/* Audio Frequency Bars — 48 bars around */}
          <div className="absolute inset-0 z-10">
            {[...Array(48)].map((_, i) => {
              const baseH = 12 + Math.sin(i * 0.7) * 16
              const colors = ['#a78bfa', '#60a5fa', '#f472b6']
              const c = colors[i % 3]
              return (
                <motion.div
                  key={`fb-${i}`}
                  animate={{ scaleY: [1, 1.6 + Math.random() * 1.8, 1] }}
                  transition={{ duration: 0.6 + Math.random() * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.025 }}
                  className="absolute left-1/2 top-1/2 w-[2.5px] rounded-full origin-bottom"
                  style={{
                    height: `${baseH}px`,
                    transform: `rotate(${i * 7.5}deg) translateX(-50%) translateY(-${150 + (i % 2) * 10}px)`,
                    background: `linear-gradient(to top, ${c}50, ${c}15)`,
                    boxShadow: `0 0 8px ${c}20`,
                  }}
                />
              )
            })}
          </div>

          {/* Central Glass Mic Core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-16 rounded-full bg-[#a78bfa]/20 blur-[60px]"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -inset-10 rounded-full bg-[#60a5fa]/15 blur-[40px]"
            />
            <motion.div
              animate={{ scale: [1, 1.06, 1], borderRadius: ['24px', '28px', '24px'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.3) 0%, rgba(96,165,250,0.2) 50%, rgba(167,139,250,0.1) 100%)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                boxShadow: '0 0 80px rgba(167,139,250,0.3), 0 0 160px rgba(167,139,250,0.1), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" />
              <div className="absolute top-3 left-4 w-[40%] h-[25%] rounded-full bg-white/[0.08] blur-[6px] rotate-[-15deg]" />
            </motion.div>
          </div>

          {/* Floating tech tags — cinematic entrance */}
          {[
            { label: 'Deepgram Nova-2', x: '-14%', y: '16%', color: '#60a5fa', d: 0 },
            { label: 'Groq LPU', x: '80%', y: '10%', color: '#a78bfa', d: 1.0 },
            { label: 'ElevenLabs TTS', x: '84%', y: '72%', color: '#f472b6', d: 2.0 },
            { label: 'Full-Duplex', x: '-10%', y: '74%', color: '#34d399', d: 3.0 },
            { label: '<400ms', x: '38%', y: '-6%', color: '#fbbf24', d: 0.6 },
          ].map((b, i) => (
            <motion.div
              key={`lb-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.8, 1, 1, 0.9], y: [6, 0, 0, -6] }}
              transition={{ duration: 5, repeat: Infinity, delay: b.d, ease: 'easeInOut' }}
              className="absolute px-3 py-1.5 rounded-xl border backdrop-blur-lg text-[10px] font-bold tracking-wider whitespace-nowrap z-30"
              style={{
                left: b.x, top: b.y,
                borderColor: `${b.color}25`, background: `${b.color}10`, color: `${b.color}cc`,
                boxShadow: `0 0 30px ${b.color}10, 0 4px 16px rgba(0,0,0,0.3)`,
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                {b.label}
              </span>
            </motion.div>
          ))}

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06] z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="6" y1="20" x2="45" y2="45" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="88" y1="14" x2="55" y2="45" stroke="#a78bfa" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="90" y1="76" x2="55" y2="55" stroke="#f472b6" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="6" y1="78" x2="45" y2="55" stroke="#34d399" strokeWidth="0.5" strokeDasharray="2 3" />
          </svg>

          {/* Cinematic particle stars */}
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={`sp-${i}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.7, 0],
                y: [0, -100 - Math.random() * 120],
                x: [0, (Math.random() - 0.5) * 80],
              }}
              transition={{
                duration: 4 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: 'easeOut',
              }}
              className="absolute rounded-full z-10"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                top: `${40 + Math.random() * 20}%`,
                left: `${30 + Math.random() * 40}%`,
                background: ['#a78bfa', '#60a5fa', '#f472b6', '#c084fc'][i % 4],
                boxShadow: `0 0 8px ${['#a78bfa', '#60a5fa', '#f472b6', '#c084fc'][i % 4]}60`,
              }}
            />
          ))}
        </motion.div>

        {/* ── Interactive Dashboard Preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 120, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.0, duration: 1.6, easeOutExpo }}
          className="relative z-20 w-full max-w-[1000px] mt-14"
        >
          <div className="absolute -inset-6 bg-gradient-to-b from-[#a78bfa]/10 via-[#60a5fa]/8 to-transparent rounded-[3rem] blur-3xl" />
          <div className="relative rounded-[28px] border border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            {/* Glassmorphic window bar */}
            <div className="flex items-center px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.015] backdrop-blur-xl">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#ff5f57] transition-colors duration-300" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#febb2e] transition-colors duration-300" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#28c840] transition-colors duration-300" />
              </div>
              <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl">
                <Lock className="w-3 h-3 text-white/20" />
                <span className="text-[12px] text-white/20 font-medium tracking-wide">app.vocred.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono tracking-wider">LIVE</span>
              </div>
            </div>
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.005]">
              {tabs.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                    activeTab === i
                      ? 'bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'text-white/25 hover:text-white/50 hover:bg-white/[0.02]'
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" style={activeTab === i ? { color: f.color } : {}} />
                  {f.label}
                </button>
              ))}
            </div>
            {/* Content area */}
            <div className="p-6 min-h-[260px] bg-gradient-to-b from-white/[0.01] to-transparent relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {tabs[activeTab].lines.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.w === 'U' ? 24 : -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.4 }}
                      className={`flex items-start gap-3 ${m.w === 'U' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          m.w === 'AI'
                            ? 'bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] shadow-[0_0_12px_rgba(167,139,250,0.3)]'
                            : m.w === 'U'
                            ? 'bg-white/[0.06] text-white/60'
                            : 'bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa]'
                        }`}
                      >
                        {m.w === 'AI' ? <Bot className="w-3.5 h-3.5 text-white" /> : m.w === 'S' ? <Activity className="w-3.5 h-3.5" /> : 'U'}
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-xl text-[13px] leading-relaxed max-w-md ${
                          m.w === 'AI'
                            ? 'bg-[#a78bfa]/8 border border-[#a78bfa]/15 text-white/85 rounded-tl-sm'
                            : m.w === 'U'
                            ? 'bg-white/[0.04] border border-white/[0.06] text-white/55 rounded-tr-sm'
                            : 'bg-[#60a5fa]/5 border border-[#60a5fa]/10 text-[#93c5fd] font-mono text-[12px]'
                        }`}
                      >
                        {m.t}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
              {/* Waveform */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex items-end gap-[2px] h-4">
                  {[2, 5, 8, 4, 9, 5, 3, 7, 4, 6, 3, 2, 5, 8, 3, 6].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{ background: `linear-gradient(to top, ${tabs[activeTab].color}40, ${tabs[activeTab].color})` }}
                      animate={{ height: [`${h * 1.5}px`, `${h * 4}px`, `${h * 1.5}px`] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[12px] font-mono tracking-wide"
                  style={{ color: tabs[activeTab].color }}
                >
                  Processing · 120ms
                </motion.span>
              </div>
            </div>
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-t border-white/[0.04] bg-black/30 text-[11px] text-white/20 font-mono tracking-wider backdrop-blur-xl">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" /> Groq LPU</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" /> Nova-2 STT</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" /> Edge TTS</span>
              </div>
              <span className="text-white/30">Full-Duplex · Ultra Low Latency</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-5 h-9 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-1 h-2.5 rounded-full bg-white/25"
            />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 2: TRUST BAR — Cinematic Marquee
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative">
        <GlowLine />
        <ParticleField count={10} />
        <div className="max-w-[1280px] mx-auto px-6 text-center py-16">
          <motion.p
            {...fadeUpInView()}
            className="text-[11px] text-white/20 font-semibold tracking-[0.3em] uppercase mb-12"
          >
            Powering the next generation of voice AI
          </motion.p>
          <div className="flex overflow-hidden relative w-full">
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#030305] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#030305] to-transparent z-10" />
            <motion.div
              animate={{ x: [0, -1200] }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 40 }}
              className="flex items-center gap-20 whitespace-nowrap"
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-20">
                  {['Groq', 'Deepgram', 'ElevenLabs', 'Twilio', 'OpenAI', 'Anthropic', 'Google', 'Make.com', 'Zapier', 'n8n'].map(b => (
                    <span
                      key={b}
                      className="text-[18px] md:text-[24px] font-bold text-white/[0.08] tracking-tight hover:text-white/30 transition-all duration-700 cursor-default hover:scale-110"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        <GlowLine />
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 3: STATS — Cinematic 3D Floating Cards
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-36 px-6 relative overflow-hidden">
        <ParticleField count={15} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-[#a78bfa]/4 blur-[250px] pointer-events-none rounded-full" />
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              {...staggerInView(i * 0.1)}
              style={{
                transformStyle: 'preserve-3d',
                perspective: '800px',
              }}
            >
              <motion.div
                whileHover={{
                  rotateX: 4,
                  rotateY: 6,
                  scale: 1.03,
                  z: 20,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative p-8 md:p-10 text-center rounded-3xl overflow-hidden group cursor-default"
                style={{
                  border: '1px solid rgba(255,255,255,0.04)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                {/* Hover glow */}
                <motion.div
                  className="absolute -inset-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${s.accent}08 0%, transparent 70%)`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(to right, transparent, ${s.accent}30, transparent)`,
                  }}
                />
                <p
                  className="text-[44px] md:text-[60px] font-black tracking-tighter mb-2 relative z-10"
                  style={{
                    background: `linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  <AnimatedCounter value={s.num} prefix={s.prefix || ''} suffix={s.suffix} />
                </p>
                <p className="text-[13px] text-white/30 font-medium tracking-wide relative z-10">{s.label}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 4: FEATURES — Storytelling Cards
         ════════════════════════════════════════════════════════════════ */}
      <section id="product" className="py-36 px-6 relative overflow-hidden">
        <GlowLine />
        <div className="absolute top-[30%] right-0 w-[600px] h-[600px] bg-[#60a5fa]/4 blur-[200px] pointer-events-none rounded-full" />
        <div className="max-w-[1280px] mx-auto relative z-10">
          <motion.div {...fadeUpInView()} className="max-w-[700px] mb-20 text-center mx-auto">
            <p className="text-[12px] text-[#a78bfa] font-bold tracking-[0.25em] uppercase mb-5">Platform Capabilities</p>
            <h2 className="text-[44px] md:text-[60px] font-black tracking-[-0.03em] leading-[1.0] mb-6">
              Everything you need.
              <br />
              <span className="bg-gradient-to-r from-white/80 to-white/25 bg-clip-text text-transparent">Nothing you don't.</span>
            </h2>
            <p className="text-[16px] text-white/30 leading-relaxed font-light max-w-[500px] mx-auto">
              One unified architecture. Any LLM, any voice, any language. Production-grade voice agents — zero compromise.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} {...staggerInView(i * 0.04)}>
                <SpotlightCard className="p-7 h-full group">
                  {/* Accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(to right, ${f.accent}, transparent)` }}
                  />
                  <div
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:shadow-[0_0_30px_rgba(167,139,250,0.12)] transition-all duration-500"
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold tracking-[0.2em] uppercase"
                      style={{ color: `${f.accent}99` }}
                    >
                      {f.sub}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-[14px] text-white/30 leading-relaxed font-light">{f.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 5: HOW IT WORKS — Cinematic Timeline with 3D Scene
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-36 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f472b6]/3 blur-[220px] pointer-events-none rounded-full" />
        <ParticleField count={12} />
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-[#f472b6] font-bold tracking-[0.25em] uppercase mb-5">Quick Integration</p>
            <h2 className="text-[44px] md:text-[60px] font-black tracking-[-0.03em] leading-[1.0] mb-6">
              From zero to live
              <br />
              <span className="bg-gradient-to-r from-white/80 to-white/25 bg-clip-text text-transparent">in five minutes.</span>
            </h2>
            <p className="text-[16px] text-white/30 leading-relaxed font-light mb-12 max-w-[460px]">
              We've abstracted the entire real-time voice pipeline into three simple steps. No WebRTC expertise needed.
            </p>

            <div className="flex flex-col gap-8">
              {[
                { n: '01', title: 'Configure LLM & Persona', desc: 'Choose Groq, OpenAI, or Gemini. Pick a voice from 30+ languages. Set the personality.', color: '#a78bfa' },
                { n: '02', title: 'Attach Knowledge & Tools', desc: 'Upload documents for RAG or connect your APIs via webhooks for real-time actions.', color: '#60a5fa' },
                { n: '03', title: 'Deploy & Scale', desc: 'Get a phone number instantly or embed our web widget. Auto-scales to thousands of concurrent calls.', color: '#f472b6' },
              ].map((s, i) => (
                <motion.div key={i} {...staggerInView(i * 0.12)} className="flex gap-5 group">
                  <div className="relative flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-11 h-11 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-[13px] font-bold text-white/40 group-hover:text-white group-hover:border-white/20 transition-all z-10 relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${s.color}20, transparent)` }}
                      />
                      <span className="relative group-hover:opacity-0 transition-opacity duration-300">{s.n}</span>
                      <motion.div
                        className="absolute w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100"
                        style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }}
                      />
                    </motion.div>
                    {i !== 2 && (
                      <div
                        className="w-px h-full bg-gradient-to-b from-white/[0.06] to-transparent mt-1 group-hover:from-white/20 transition-colors"
                      />
                    )}
                  </div>
                  <div className="pt-2 pb-2">
                    <h3 className="text-[16px] font-bold mb-1.5 tracking-tight text-white/90">{s.title}</h3>
                    <p className="text-[14px] text-white/30 leading-relaxed font-light">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 3D Architecture Scene */}
          <motion.div {...fadeUpInView(0.2)} className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#a78bfa]/8 to-[#f472b6]/8 blur-[120px] rounded-full" />
            <div className="relative p-1.5 rounded-3xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl shadow-2xl">
              <div className="rounded-[20px] overflow-hidden border border-white/[0.03] bg-[#080810] p-8 h-[480px] flex flex-col justify-center items-center relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Orbital rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                  className="w-64 h-64 rounded-full border border-dashed border-white/[0.05] absolute"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                  className="w-44 h-44 rounded-full border border-dashed border-[#f472b6]/12 absolute"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                  className="w-80 h-80 rounded-full border border-dashed border-white/[0.03] absolute"
                />

                {/* Orbiting tech nodes */}
                {[
                  { label: 'STT', color: '#60a5fa', size: 64, delay: 0 },
                  { label: 'LLM', color: '#a78bfa', size: 72, delay: -12 },
                  { label: 'TTS', color: '#f472b6', size: 64, delay: -24 },
                ].map((node, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 35, repeat: Infinity, ease: 'linear', delay: node.delay }}
                    className="absolute"
                    style={{ width: node.size * 4, height: node.size * 4 }}
                  >
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider backdrop-blur-md"
                      style={{
                        borderColor: `${node.color}25`,
                        background: `${node.color}08`,
                        color: `${node.color}cc`,
                        boxShadow: `0 0 25px ${node.color}10`,
                      }}
                    >
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 35, repeat: Infinity, ease: 'linear', delay: node.delay }}
                      >
                        {node.label}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* Center core */}
                <div className="relative z-10">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], borderRadius: ['16px', '20px', '16px'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#f472b6] shadow-[0_0_60px_rgba(167,139,250,0.3)] flex items-center justify-center"
                  >
                    <Zap className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="absolute -inset-5 rounded-3xl bg-gradient-to-br from-[#a78bfa]/15 to-[#f472b6]/15 blur-xl -z-10" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 6: INTEGRATIONS ── Premium Grid
         ════════════════════════════════════════════════════════════════ */}
      <section id="developers" className="py-36 px-6 relative">
        <GlowLine />
        <ParticleField count={8} />
        <div className="max-w-[1280px] mx-auto text-center relative z-10">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-white/20 font-bold tracking-[0.25em] uppercase mb-5">Ecosystem</p>
            <h2 className="text-[40px] md:text-[52px] font-black tracking-[-0.03em] mb-4">
              Plug into your{' '}
              <span className="bg-gradient-to-r from-[#c084fc] to-[#60a5fa] bg-clip-text text-transparent">existing stack</span>
            </h2>
            <p className="text-[16px] text-white/25 font-light mb-14 max-w-[500px] mx-auto">
              First-class integrations with the tools you already use.
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3 max-w-[1000px] mx-auto">
            {['Groq', 'OpenAI', 'Gemini', 'Anthropic', 'Deepgram', 'ElevenLabs', 'Azure', 'Twilio', 'n8n', 'Zapier', 'Make.com', 'WhatsApp', 'Salesforce', 'HubSpot', 'Zendesk', 'Stripe', 'Slack', 'Google Calendar'].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.05 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.015, duration: 0.4, type: 'spring', stiffness: 200 }}
                className="px-5 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.015] text-[13px] font-medium text-white/40 hover:border-[#a78bfa]/25 hover:text-white/70 hover:bg-[#a78bfa]/5 hover:shadow-[0_0_30px_rgba(167,139,250,0.08)] transition-all cursor-default backdrop-blur-md"
              >
                {t}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 7: PRICING ── Cinematic Cards
         ════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-36 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#a78bfa]/4 blur-[250px] rounded-full pointer-events-none" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <motion.div {...fadeUpInView()} className="text-center mb-16">
            <p className="text-[12px] text-[#a78bfa] font-bold tracking-[0.25em] uppercase mb-5">Pricing</p>
            <h2 className="text-[44px] md:text-[60px] font-black tracking-[-0.03em] leading-[1.0] mb-4">
              Enterprise features.
              <br />
              <span className="bg-gradient-to-r from-[#c084fc] to-[#60a5fa] bg-clip-text text-transparent">Open source pricing.</span>
            </h2>
            <p className="text-[16px] text-white/25 font-light max-w-[500px] mx-auto">
              Every feature that costs $3,000+/mo elsewhere is free on Vocred. Forever.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Starter', price: 'Free', desc: 'Perfect for testing & prototyping',
                features: ['100 minutes/month', 'Groq LLM (free tier)', 'Edge TTS (unlimited)', '1 agent', 'Web widget', 'Community support'],
                cta: 'Get started', primary: false,
              },
              {
                name: 'Pro', price: 'Free', desc: 'For production deployments',
                features: ['Unlimited minutes', 'All LLM providers', 'All TTS providers', 'Unlimited agents', 'Phone numbers', 'Campaigns & analytics', 'RAG & knowledge base', 'Priority support'],
                cta: 'Start building', primary: true,
              },
              {
                name: 'Enterprise', price: 'Free', desc: 'Full platform access',
                features: ['Everything in Pro', 'Custom SIP trunking', 'RBAC & team management', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations', 'White-label option', '24/7 support'],
                cta: 'Contact us', primary: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                {...staggerInView(i * 0.1)}
                className={`relative p-8 rounded-3xl border backdrop-blur-md transition-all duration-500 group ${
                  plan.primary
                    ? 'border-[#a78bfa]/25 bg-gradient-to-b from-[#a78bfa]/[0.06] to-[#030305] shadow-[0_0_60px_rgba(167,139,250,0.08)]'
                    : 'border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.025]'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '800px',
                }}
              >
                {plan.primary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] text-[11px] font-bold tracking-wider text-white shadow-[0_0_25px_rgba(167,139,250,0.3)]">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-[18px] font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[44px] font-black tracking-tight">{plan.price}</span>
                  <span className="text-[14px] text-white/25 font-medium">/forever</span>
                </div>
                <p className="text-[14px] text-white/30 mb-6 font-light">{plan.desc}</p>
                <Link href="/auth/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all mb-8 ${
                      plan.primary
                        ? 'bg-white text-[#030305] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]'
                        : 'border border-white/[0.1] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-[13px] text-white/40 font-light">
                      <div className="w-1 h-1 rounded-full bg-[#a78bfa]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 8: TESTIMONIALS ── Premium Cards with Grain
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-36 px-6 relative overflow-hidden">
        <GlowLine />
        <ParticleField count={8} />
        <div className="max-w-[1280px] mx-auto">
          <motion.div {...fadeUpInView()} className="text-center mb-16">
            <p className="text-[12px] text-white/20 font-bold tracking-[0.25em] uppercase mb-5">Testimonials</p>
            <h2 className="text-[40px] md:text-[56px] font-black tracking-[-0.03em]">Built for massive scale.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: 'We replaced our entire inbound support team with Vocred agents. Response time went from hours to seconds.', name: 'Rahul S.', role: 'CTO, TechStartup', gradient: 'from-[#a78bfa] to-[#60a5fa]' },
              { quote: 'The Hindi + English multilingual support is incredible. Our Hindi-speaking customers finally feel heard.', name: 'Priya M.', role: 'Product Lead, FinTech', gradient: 'from-[#60a5fa] to-[#22d3ee]' },
              { quote: 'Webhook integration means every call auto-populates our CRM. Zero manual data entry. Absolutely incredible.', name: 'Amit K.', role: 'Ops Manager, D2C Brand', gradient: 'from-[#f472b6] to-[#a78bfa]' },
            ].map((t, i) => (
              <motion.div
                key={i}
                {...staggerInView(i * 0.1)}
                className="relative p-7 rounded-3xl border border-white/[0.05] bg-white/[0.015] hover:-translate-y-1.5 transition-all duration-500 group"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#a78bfa]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="text-[15px] text-white/50 leading-relaxed mb-7 font-light">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${t.gradient} flex items-center justify-center text-[13px] font-bold shadow-lg`}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/80">{t.name}</p>
                    <p className="text-[11px] text-white/25">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         SCENE 9: CTA ── Cinematic Finale
         ════════════════════════════════════════════════════════════════ */}
      <section className="py-48 px-6 relative overflow-hidden">
        <GlowLine />
        <ParticleField count={20} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-[#a78bfa]/12 via-[#60a5fa]/6 to-transparent blur-[160px]" />
        </div>

        <motion.div {...fadeUpInView()} className="max-w-[900px] mx-auto text-center relative z-10">
          {/* Animated icon */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              borderRadius: ['20px', '28px', '20px'],
              boxShadow: [
                '0 0 60px rgba(167,139,250,0.2)',
                '0 0 100px rgba(167,139,250,0.4)',
                '0 0 60px rgba(167,139,250,0.2)',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#60a5fa] shadow-[0_0_80px_rgba(167,139,250,0.25)] flex items-center justify-center mx-auto mb-10"
          >
            <Mic className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-[52px] md:text-[80px] font-black tracking-[-0.04em] leading-[0.9] mb-8">
            Ready to deploy your
            <br />
            <span className="bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">
              first voice agent?
            </span>
          </h2>
          <p className="text-[18px] text-white/25 mb-14 leading-relaxed font-light max-w-[500px] mx-auto">
            Get started in under 5 minutes. No credit card. No usage limits. Just build.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="group relative flex items-center gap-2.5 px-10 py-5 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white rounded-full" />
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#60a5fa]" />
                <span className="relative text-[#030305] group-hover:text-white transition-colors duration-700 font-bold text-[16px] tracking-wide flex items-center gap-2.5">
                  Start building for free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-10 py-5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[16px] text-white/40 hover:text-white/70 hover:bg-white/[0.05] hover:border-white/[0.15] transition-all font-medium backdrop-blur-md"
              >
                Sign in to dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative">
        <GlowLine />
        <div className="max-w-[1280px] mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.png" alt="Vocred Logo" width={150} height={50} className="h-10 w-auto object-contain" />
              </Link>
              <p className="text-[13px] text-white/20 leading-relaxed font-light">The open-source enterprise voice AI platform. Build conversational AI agents with our Voice API to automate inbound support and outbound sales.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Developers', links: ['Documentation', 'API Reference', 'SDKs', 'Status'] },
              { title: 'Company', links: ['About', 'Blog', 'Twitter', 'GitHub'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[12px] font-semibold text-white/30 tracking-[0.15em] uppercase mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-[13px] text-white/15 hover:text-white/40 transition-colors font-light">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
            <p className="text-[12px] text-white/12 font-light">&copy; 2026 Vocred. All rights reserved.</p>
            <div className="flex gap-6 text-[12px] text-white/12">
              {['Privacy', 'Terms', 'Cookies'].map(l => (
                <a key={l} href="#" className="hover:text-white/30 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── 3D Orbit Label Helper ──
function OrbitLabel({
  rotateX,
  rotateY,
  duration,
  label,
  color,
}: {
  rotateX: number
  rotateY: number
  duration: number
  label: string
  color: string
}) {
  return (
    <motion.div
      animate={{ rotateX: [rotateX, rotateX], rotateY: [rotateY, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        className="px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-widest backdrop-blur-md whitespace-nowrap"
        style={{
          borderColor: `${color}30`,
          background: `${color}15`,
          color: `${color}dd`,
          boxShadow: `0 0 25px ${color}20, 0 4px 12px rgba(0,0,0,0.2)`,
        }}
      >
        {label}
      </div>
    </motion.div>
  )
}
