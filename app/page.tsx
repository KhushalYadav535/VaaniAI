'use client';

import Link from 'next/link';
import { ArrowRight, Mic, Zap, Phone, BarChart3, Shield, CheckCircle2, Play, Globe, Cpu, Waves, Bot, ChevronRight, Star } from 'lucide-react';
import { motion, useScroll, useTransform, animate, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
});

const fadeUpInView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
});

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll(
    mounted ? { target: heroRef, offset: ['start start', 'end start'] } : {}
  );
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  if (!mounted) return <div className="min-h-screen bg-[#050507]" />;

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <motion.nav {...fadeUp(0)} className="fixed top-0 w-full z-50 border-b border-white/[0.04] bg-[#050507]/60 backdrop-blur-2xl">
        <div className="max-w-[1200px] mx-auto px-6 h-[70px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">VaaniAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-[14px] text-white/40 font-medium">
            {['Product', 'Developers', 'Pricing', 'Company'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-300">{l}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-[14px] font-medium text-white/50 hover:text-white transition-all">Log in</Link>
            <Link href="/auth/register">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-[#050507] text-[14px] font-bold hover:bg-white/90 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Start Building <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[110vh] flex flex-col items-center justify-center text-center px-6 pt-[80px] overflow-hidden">

        {/* NATIVE 3D GLASS ORB & AURA */}
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
          {/* Animated SVG Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_30%,#000_10%,transparent_100%)]" />
          
          {/* Floating background particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -50, 0],
                x: [0, 30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-2 h-2 rounded-full bg-[#7c3aed] blur-[2px]"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
              }}
            />
          ))}

          {/* Ambient Glow behind the model */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7c3aed]/10 blur-[150px] rounded-full" />
          
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] opacity-70 mix-blend-screen"
          >
            {/* Core Orb */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7c3aed] via-[#3b82f6] to-[#ec4899] blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '6s' }} />
            
            {/* Glass Rings (Pseudo-3D) */}
            <motion.div
              animate={{ rotateX: [0, 360], rotateY: [0, 180] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[10%] rounded-full border-[2px] border-white/10 shadow-[inset_0_0_80px_rgba(124,58,237,0.3)]"
            />
            <motion.div
              animate={{ rotateX: [180, 0], rotateY: [360, 0] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[20%] rounded-full border-[1px] border-white/5 shadow-[inset_0_0_40px_rgba(59,130,246,0.3)]"
            />
            
            {/* Inner Glowing Core */}
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-white/20 blur-[40px]"
            />
          </motion.div>

          {/* Vignette & Fade over the model to blend perfectly */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/10 via-transparent to-[#050507] z-10 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_100%)] z-10" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroO }} className="relative z-20 max-w-[900px] mt-[-10vh]">

          {/* Premium Pill Badge */}
          <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.02] backdrop-blur-md text-[13px] text-white/70 mb-10 font-medium shadow-[0_0_30px_rgba(124,58,237,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]"></span>
            </span>
            Introducing Vaani Engine 2.0 · Sub-400ms latency
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </motion.div>

          {/* Ultra-Premium Headline with Character Reveal */}
          <motion.div {...fadeUp(0.2)} className="mb-8 overflow-hidden">
            <h1 className="text-[64px] sm:text-[84px] md:text-[104px] font-extrabold tracking-[-0.05em] leading-[0.9]">
              {'The intelligent '.split('').map((char, index) => (
                <motion.span
                  key={`char-1-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.02, ease: [0.2, 0.65, 0.3, 0.9] }}
                >
                  {char}
                </motion.span>
              ))}
              <br />
              <span className="bg-gradient-to-b from-white via-white/90 to-white/30 bg-clip-text text-transparent drop-shadow-2xl">
                {'voice layer.'.split('').map((char, index) => (
                  <motion.span
                    key={`char-2-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.03, ease: [0.2, 0.65, 0.3, 0.9] }}
                    className="inline-block"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </h1>
          </motion.div>

          <motion.p {...fadeUp(0.3)} className="text-[18px] md:text-[21px] text-white/40 max-w-[560px] mx-auto mb-12 leading-[1.6] font-light">
            Deploy hyper-realistic voice AI agents in minutes. Integrated with the world's fastest LLMs and native telephony infrastructure.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.4)} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#050507] font-bold text-[15px] hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] group">
                Start building for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[15px] text-white/80 font-medium transition-all backdrop-blur-md">
              <Play className="w-4 h-4 fill-current" /> Book a Demo
            </motion.button>
          </motion.div>

          <motion.p {...fadeUp(0.5)} className="mt-6 text-[13px] text-white/30 font-medium">
            100 free minutes included · No credit card required
          </motion.p>
        </motion.div>

        {/* ── Dashboard/Terminal Preview ── */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 w-full max-w-[900px] mt-24"
        >
          <div className="absolute -inset-1 bg-gradient-to-b from-[#3b82f6]/20 to-transparent rounded-[2rem] blur-2xl" />
          <div className="relative rounded-3xl border border-white/[0.08] bg-[#050507]/60 backdrop-blur-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10 hover:bg-[#ff5f57] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-white/10 hover:bg-[#febb2e] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-white/10 hover:bg-[#28c840] transition-colors" />
              </div>
              <span className="mx-auto text-[12px] text-white/30 font-medium tracking-wide">app.vaaniai.com</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3b82f6]"></span>
                </span>
                <span className="text-[11px] text-[#3b82f6] font-mono tracking-wider">LIVE</span>
              </div>
            </div>

            <div className="p-8 space-y-5 min-h-[240px] bg-gradient-to-b from-white/[0.01] to-transparent">
              {/* Typing effect in Live Terminal */}
              {[
                { who: 'AI', text: 'Hi! I\'m Vaani, your intelligent voice agent. How can I assist you?', delay: 0.9, side: 'left' },
                { who: 'U',  text: 'Can you integrate with my existing CRM and handle inbound calls?', delay: 2.5, side: 'right' },
                { who: 'AI', text: 'Absolutely. I can connect to Salesforce or Hubspot via webhooks, and handle thousands of concurrent calls with sub-400ms latency. Would you like a demo?', delay: 4.5, side: 'left' },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.side === 'left' ? -20 : 20, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} transition={{ delay: m.delay, duration: 0.6, type: "spring", stiffness: 100 }}
                  className={`flex items-end gap-3 ${m.side === 'right' ? 'flex-row-reverse' : ''}`}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: m.delay + 0.2 }}
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${m.who === 'AI' ? 'bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'bg-white/10 text-white/70'}`}
                  >
                    {m.who}
                  </motion.div>
                  <div className={`px-5 py-3 rounded-2xl text-[14px] max-w-md leading-relaxed ${
                    m.who === 'AI' ? 'bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-white/90 rounded-bl-sm backdrop-blur-md' : 'bg-white/[0.04] border border-white/[0.05] text-white/70 rounded-br-sm backdrop-blur-md'
                  }`}>
                    {/* Simulated typing animation for text */}
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: m.delay + 0.3 }}
                    >
                      {m.text}
                    </motion.span>
                  </div>
                </motion.div>
              ))}

              {/* Waveform */}
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: 6.5 }}
                className="flex items-center gap-3 pt-4 ml-11 overflow-hidden">
                <div className="flex items-end gap-[3px] h-5">
                  {[2,5,8,4,9,5,3,7,4,6,3,2].map((h, i) => (
                    <motion.div key={i} className="w-[3px] bg-gradient-to-t from-[#3b82f6] to-[#7c3aed] rounded-full"
                      animate={{ height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }} />
                  ))}
                </div>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[12px] text-[#3b82f6] font-mono tracking-wide"
                >
                  Processing response... 120ms
                </motion.span>
              </motion.div>
            </div>
            
            {/* Bottom status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-white/[0.04] bg-black/20 text-[11px] text-white/30 font-mono tracking-wider">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Groq LPU</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/> Nova-2 STT</span>
              </div>
              <span className="text-white/40">ElevenLabs · Ultra Low Latency</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-[1px] h-10 bg-gradient-to-b from-transparent to-white/10" />
        </motion.div>
      </section>

      {/* ── LOGOS / TRUST ────────────────────────────────── */}
      <section className="py-20 border-y border-white/[0.04] bg-[#050507] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.05)_0%,transparent_100%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
          <p className="text-[11px] text-white/30 font-semibold tracking-[0.2em] uppercase mb-10">Trusted by modern infrastructure teams</p>
          
          {/* Infinite Marquee */}
          <div className="flex overflow-hidden relative w-full">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050507] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050507] to-transparent z-10" />
            <motion.div
              animate={{ x: [0, -1035] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex items-center gap-16 md:gap-24 whitespace-nowrap px-8"
            >
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center gap-16 md:gap-24">
                  {['Groq', 'Deepgram', 'ElevenLabs', 'Twilio', 'OpenAI', 'Anthropic', 'Make.com', 'Zapier'].map(b => (
                    <span key={b} className="text-[16px] md:text-[20px] font-bold text-white/20 tracking-tight hover:text-white/60 transition-colors duration-500 cursor-default">{b}</span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#3b82f6]/5 blur-[200px] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {[
            { val: '<400ms', label: 'E2E Voice Latency' },
            { val: '30+',    label: 'Native Languages' },
            { val: '99.99%',  label: 'Infrastructure Uptime' },
            { val: '10x',    label: 'Cost Reduction' },
          ].map((s, i) => (
            <motion.div key={i} {...fadeUpInView(i * 0.1)} 
              className="relative p-8 text-center rounded-3xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-all overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[44px] md:text-[56px] font-black tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent mb-2 relative z-10">{s.val}</p>
              <p className="text-[13px] text-white/40 font-medium tracking-wide relative z-10">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 border-t border-white/[0.04] relative">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUpInView()} className="max-w-[600px] mb-20 text-center mx-auto">
            <p className="text-[12px] text-[#3b82f6] font-bold tracking-[0.2em] uppercase mb-5">Platform Capabilities</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight leading-[1.05] mb-6">
              Everything you need to<br />ship at scale.
            </h2>
            <p className="text-[16px] text-white/40 leading-relaxed font-light">One unified architecture. Bring any LLM, any voice, any language. Deploy production-grade voice agents with zero compromise.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap,      title: 'Sub-400ms Latency',     desc: 'Full-duplex audio pipeline with intelligent VAD barge-in. Zero awkward silences.' },
              { icon: Cpu,      title: 'Model Agnostic',      desc: 'Plug in Groq, OpenAI, Gemini or custom endpoints seamlessly without rewriting.' },
              { icon: Mic,      title: 'Multilingual STT',      desc: 'Flawless Hindi, Hinglish, English and 30+ languages via Deepgram Nova-2.' },
              { icon: Bot,      title: 'Visual Workflow Engine',desc: 'Drag-and-drop call flow designer. Build complex IVR systems with zero code.' },
              { icon: Globe,    title: 'Post-Call Webhooks',    desc: 'Auto-push transcripts, sentiment & structured data to n8n, Zapier, or your API.' },
              { icon: BarChart3,'title': 'Deep Analytics',     desc: 'QA scoring, sentiment timelines, recordings and automatic CRM population.' },
              { icon: Shield,   title: 'Enterprise RBAC',          desc: 'Granular role-based access control, team invites and strict per-org data isolation.' },
              { icon: Phone,    title: 'Native Telephony',   desc: 'Buy numbers, run bulk campaigns, handle inbound & outbound within one dashboard.' },
              { icon: Waves,    title: 'Smart Interruption',   desc: 'Agent processes audio while speaking. Natural human-like interruption handling.' },
            ].map((f, i) => (
              <motion.div key={i} {...fadeUpInView(i * 0.05)}>
                <SpotlightCard className="p-8 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:border-[#7c3aed]/40 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all">
                    <f.icon className="w-5 h-5 text-[#a78bfa]" />
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-3 tracking-tight">{f.title}</h3>
                  <p className="text-[14px] text-white/40 leading-relaxed font-light">{f.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ec4899]/5 blur-[150px] pointer-events-none rounded-full" />
        <div className="max-w-[1000px] mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-[#ec4899] font-bold tracking-[0.2em] uppercase mb-5">Quick Integration</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight leading-[1.05] mb-6">
              From zero to live<br />in five minutes.
            </h2>
            <p className="text-[16px] text-white/40 leading-relaxed font-light mb-10">Stop spending months on custom telephony and WebRTC orchestration. We've abstracted the entire real-time voice pipeline into three simple steps.</p>
            
            <div className="flex flex-col gap-6">
              {[
                { n: '1', title: 'Configure the LLM & Persona', desc: 'Select your preferred intelligence engine (Groq, OpenAI) and assign a hyper-realistic voice.' },
                { n: '2', title: 'Attach Knowledge & Tools', desc: 'Upload documents or expose your API via webhooks to give your agent context and action capabilities.' },
                { n: '3', title: 'Deploy via Number or Web', desc: 'Purchase a Twilio number instantly or embed our React web widget to start taking calls.' },
              ].map((s, i) => (
                <motion.div key={i} {...fadeUpInView(i * 0.15)}
                  className="flex gap-6 group">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[14px] font-bold text-white/50 group-hover:border-[#ec4899]/50 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all z-10 relative bg-[#050507]">
                      {s.n}
                    </div>
                    {i !== 2 && <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[2px] h-[40px] bg-gradient-to-b from-white/10 to-transparent group-hover:from-[#ec4899]/50 transition-colors" />}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-[16px] font-bold mb-2 tracking-tight">{s.title}</h3>
                    <p className="text-[14px] text-white/40 leading-relaxed font-light">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUpInView(0.3)} className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/20 to-[#ec4899]/20 blur-[80px] rounded-full" />
            <div className="relative p-2 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl shadow-2xl">
              <div className="rounded-2xl overflow-hidden border border-white/[0.04] bg-[#0c0d12] p-8 h-[400px] flex flex-col justify-center items-center relative">
                {/* Abstract Node Connection Animation */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,white/[0.02]_1px,transparent_1px),linear-gradient(to_bottom,white/[0.02]_1px,transparent_1px)] bg-[size:40px_40px]" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="w-48 h-48 rounded-full border border-dashed border-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border border-dashed border-[#ec4899]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_0_30px_rgba(236,72,153,0.5)] z-10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-white/30 font-bold tracking-[0.2em] uppercase mb-10">Ecosystem</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-12">Plug into your existing stack</h2>
            <div className="flex flex-wrap justify-center gap-4 max-w-[800px] mx-auto">
              {['Groq', 'OpenAI', 'Gemini', 'Deepgram', 'ElevenLabs', 'Twilio', 'n8n', 'Zapier', 'Make.com', 'WhatsApp', 'Salesforce', 'Zendesk', 'HubSpot', 'Stripe'].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                  className="px-6 py-3 rounded-full border border-white/[0.08] bg-white/[0.02] text-[14px] font-medium text-white/60 hover:border-[#3b82f6]/50 hover:text-white hover:bg-[#3b82f6]/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all cursor-default backdrop-blur-md">
                  {t}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-[1200px] mx-auto">
          <motion.div {...fadeUpInView()} className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-tight">Built for massive scale.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'We replaced our entire inbound support team with VaaniAI agents. Response time went from hours to seconds.', name: 'Rahul S.', role: 'CTO, TechStartup' },
              { quote: 'The Hindi + English multilingual support is incredible. Our Hindi-speaking customers finally feel heard.', name: 'Priya M.', role: 'Product Lead, FinTech' },
              { quote: 'n8n webhook integration means every call auto-populates our CRM. Zero manual data entry now.', name: 'Amit K.', role: 'Ops Manager, D2C Brand' },
            ].map((t, i) => (
              <motion.div key={i} {...fadeUpInView(i * 0.1)}
                className="relative p-8 rounded-3xl border border-white/[0.06] bg-[#050507] hover:-translate-y-2 transition-transform duration-500 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#7c3aed]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-[#febb2e] text-[#febb2e]" />)}
                </div>
                <p className="text-[16px] text-white/70 leading-relaxed mb-8 font-light">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6] flex items-center justify-center text-[14px] font-bold">{t.name[0]}</div>
                  <div>
                    <p className="text-[14px] font-bold text-white">{t.name}</p>
                    <p className="text-[12px] text-white/40">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-40 px-6 relative overflow-hidden">
        {/* Massive Glowing Aura for Footer */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-t from-[#3b82f6]/20 via-[#7c3aed]/10 to-transparent blur-[100px] pointer-events-none" />
        
        <motion.div {...fadeUpInView()} className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-[52px] md:text-[72px] font-black tracking-tighter leading-[0.95] mb-8">
            Ready to deploy your<br />
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">first voice agent?</span>
          </h2>
          <p className="text-[18px] text-white/40 mb-12 leading-relaxed font-light max-w-[500px] mx-auto">
            Get 100 free minutes instantly. No credit card required. Experience sub-400ms latency today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-white text-[#050507] font-bold text-[16px] hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] group">
                Start building for free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-10 py-5 rounded-full border border-white/10 bg-white/[0.01] text-[16px] text-white/60 hover:text-white hover:bg-white/[0.05] transition-all font-medium backdrop-blur-md">
                Sign in to dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[#7c3aed] to-[#2563eb] flex items-center justify-center">
              <Mic className="w-3 h-3 text-white" />
            </div>
            <span className="text-[14px] font-semibold">VaaniAI</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[12px] text-white/25">
            {['Privacy', 'Terms', 'Documentation', 'Status', 'Twitter', 'GitHub'].map(l => (
              <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-[12px] text-white/15">© 2026 VaaniAI</p>
        </div>
      </footer>
    </div>
  );
}
