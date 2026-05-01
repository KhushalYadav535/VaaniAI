'use client';

import Link from 'next/link';
import {
  ArrowRight, Mic, Zap, Phone, BarChart3, Shield, Play, Globe, Cpu,
  Waves, Bot, ChevronRight, Star, Sparkles, Headphones, Activity, Lock,
} from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const ease = [0.16, 1, 0.3, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease, delay },
});
const fadeUpInView = (delay = 0) => ({
  initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease, delay },
});

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / 2000, 1);
          setCount(Math.floor((1 - Math.pow(1 - p, 4)) * value));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function GlowLine() {
  return (
    <div className="relative w-full h-px overflow-hidden">
      <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-[#7c3aed]/60 to-transparent" />
      <div className="absolute inset-0 bg-white/[0.04]" />
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { const t = setInterval(() => setActiveTab(p => (p + 1) % 3), 4000); return () => clearInterval(t); }, []);

  const { scrollYProgress } = useScroll(mounted ? { target: heroRef, offset: ['start start', 'end start'] } : {});
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroO = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 30 });

  useEffect(() => {
    const h = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [mouseX, mouseY]);

  if (!mounted) return <div className="min-h-screen bg-[#030305]" />;

  const tabs = [
    { label: 'Voice Agent', icon: Headphones, color: '#7c3aed', lines: [
      { w: 'AI', t: "Hi, I'm Vaani. How can I help you today?" },
      { w: 'U', t: 'I need to reschedule my appointment to Friday.' },
      { w: 'AI', t: "Done! I've moved your booking to Friday 3 PM. You'll get a confirmation SMS shortly." },
    ]},
    { label: 'Live Analytics', icon: Activity, color: '#3b82f6', lines: [
      { w: 'S', t: 'Sentiment: Positive (0.87) | Intent: Reschedule' },
      { w: 'S', t: 'QA Score: 96/100 | E2E Latency: 180ms' },
      { w: 'S', t: 'Tools Called: calendar_update, send_sms' },
    ]},
    { label: 'Auto Actions', icon: Zap, color: '#ec4899', lines: [
      { w: 'S', t: 'Google Calendar updated: Friday 3:00 PM' },
      { w: 'S', t: 'SMS confirmation sent to +91-98XXXXXX' },
      { w: 'S', t: 'CRM record synced via webhook (200 OK)' },
    ]},
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white overflow-x-hidden selection:bg-[#7c3aed]/30" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Cursor follower */}
      <motion.div style={{ x: smoothX, y: smoothY }}
        className="fixed top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.06)_0%,transparent_70%)]" />

      {/* ── NAV ──────────────────────────────────────────── */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease }}
        className="fixed top-0 w-full z-50 bg-[#030305]/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="h-[72px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#3b82f6] flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)] group-hover:shadow-[0_0_35px_rgba(124,58,237,0.7)] transition-shadow">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
              </div>
              <span className="text-[18px] font-bold tracking-tight">Vaani<span className="text-[#a78bfa]">AI</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {['Product', 'Developers', 'Pricing', 'Company'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`}
                  className="px-4 py-2 text-[14px] text-white/40 font-medium hover:text-white rounded-lg hover:bg-white/[0.04] transition-all duration-300">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="hidden sm:block text-[14px] font-medium text-white/40 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.04] transition-all">Log in</Link>
              <Link href="/auth/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#030305] text-[14px] font-semibold hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-shadow cursor-pointer">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          </div>
          <GlowLine />
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center text-center px-6 pt-[100px] pb-10 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030305_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030305] via-transparent to-[#030305]" />
          {/* Ambient glows */}
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#7c3aed]/[0.06] blur-[160px]" />
          <motion.div animate={{ scale: [1.1, 0.9, 1.1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[45%] left-[40%] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.04] blur-[140px]" />
        </div>

        {/* ── Text Content ── */}
        <motion.div style={{ y: heroY, opacity: heroO, scale: heroScale }} className="relative z-20 max-w-[960px] mt-8">
          {/* Badge */}
          <motion.div {...fadeUp(0.1)}>
            <div className="inline-flex items-center gap-3 px-1 py-1 pr-5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-[13px] text-white/60 mb-8 font-medium shadow-[0_0_40px_rgba(124,58,237,0.1)] hover:border-white/[0.15] transition-colors cursor-default group">
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#7c3aed]/20 to-[#3b82f6]/20 text-[#a78bfa] text-[12px] font-semibold">
                <Sparkles className="w-3 h-3" /> NEW
              </span>
              Vaani Engine 2.0 — Sub-400ms Full-Duplex Voice
              <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div {...fadeUp(0.2)} className="mb-6">
            <h1 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] font-extrabold tracking-[-0.04em] leading-[0.9]">
              <span className="block">The voice</span>
              <span className="block bg-gradient-to-r from-[#a78bfa] via-[#818cf8] to-[#60a5fa] bg-clip-text text-transparent pb-1">infrastructure</span>
              <span className="block bg-gradient-to-b from-white/90 to-white/25 bg-clip-text text-transparent">for AI agents.</span>
            </h1>
          </motion.div>

          <motion.p {...fadeUp(0.3)} className="text-[16px] md:text-[18px] text-white/35 max-w-[500px] mx-auto mb-8 leading-[1.7] font-light">
            Deploy enterprise-grade AI voice agents in minutes. Ultra-low latency, any LLM, any language, native telephony.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.4)} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Link href="/auth/register">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="group flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-[#030305] font-bold text-[15px] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all">
                Start building for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.15] text-[15px] text-white/70 font-medium transition-all backdrop-blur-md">
              <Play className="w-4 h-4 fill-current" /> Watch demo
            </motion.button>
          </motion.div>
          <motion.p {...fadeUp(0.45)} className="text-[13px] text-white/20 font-medium tracking-wide mb-12">
            100 free minutes · No credit card · Deploy in &lt;5 min
          </motion.p>
        </motion.div>

        {/* ── VOICE AI 3D MODEL — Visible, centered, below text ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.2, ease }}
          className="relative z-10 w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px] flex-shrink-0"
        >
          {/* Outer glow aura */}
          <div className="absolute inset-[-25%] rounded-full bg-[#7c3aed]/[0.08] blur-[100px]" />
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-[-10%] rounded-full bg-[#3b82f6]/[0.06] blur-[80px]" />

          {/* Sound wave ripples */}
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={`rp-${i}`}
              animate={{ scale: [0.25, 1.15], opacity: [0.5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
              className="absolute inset-0 rounded-full border-[1.5px] border-[#7c3aed]/30"
            />
          ))}

          {/* 3D Orbital rings with labels */}
          <div style={{ perspective: '900px' }} className="absolute inset-0">
            {/* Ring 1 */}
            <motion.div
              animate={{ rotateX: [72, 72], rotateY: [0, 360] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-[2%] rounded-full border-[2px] border-[#7c3aed]/25 shadow-[0_0_40px_rgba(124,58,237,0.1)]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div animate={{ rotateX: [-72, -72], rotateY: [360, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }}>
                  <div className="px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[11px] font-bold text-[#c4b5fd] tracking-widest shadow-[0_0_20px_rgba(124,58,237,0.4)]">STT</div>
                </motion.div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <motion.div animate={{ rotateX: [-72, -72], rotateY: [360, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }}>
                  <div className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[11px] font-bold text-[#93c5fd] tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.4)]">LLM</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Ring 2 */}
            <motion.div
              animate={{ rotateX: [-68, -68], rotateY: [360, 0] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-[8%] rounded-full border-[1.5px] border-[#ec4899]/20 shadow-[0_0_30px_rgba(236,72,153,0.08)]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div animate={{ rotateX: [68, 68], rotateY: [0, 360] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }}>
                  <div className="px-3 py-1.5 rounded-lg bg-[#ec4899]/20 border border-[#ec4899]/40 text-[11px] font-bold text-[#f9a8d4] tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.4)]">TTS</div>
                </motion.div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <motion.div animate={{ rotateX: [68, 68], rotateY: [0, 360] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }}>
                  <div className="px-3 py-1.5 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 text-[11px] font-bold text-[#6ee7b7] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">RAG</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Ring 3 - fast inner */}
            <motion.div
              animate={{ rotateX: [20, 20], rotateY: [0, -360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-[18%] rounded-full border-[1px] border-white/[0.08]"
            />
          </div>

          {/* Circular audio frequency bars */}
          <div className="absolute inset-0">
            {[...Array(48)].map((_, i) => {
              const baseH = 10 + Math.sin(i * 0.7) * 14;
              const colors = ['#7c3aed', '#3b82f6', '#ec4899'];
              const c = colors[i % 3];
              return (
                <motion.div key={`fb-${i}`}
                  animate={{ scaleY: [1, 1.5 + Math.random() * 1.5, 1] }}
                  transition={{ duration: 0.5 + Math.random() * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.02 }}
                  className="absolute left-1/2 top-1/2 w-[2.5px] rounded-full origin-bottom"
                  style={{
                    height: `${baseH}px`,
                    transform: `rotate(${i * 7.5}deg) translateX(-50%) translateY(-${130 + (i % 2) * 8}px)`,
                    background: `linear-gradient(to top, ${c}60, ${c}20)`,
                    boxShadow: `0 0 6px ${c}30`,
                  }}
                />
              );
            })}
          </div>

          {/* Central Mic Core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            {/* Glow layers */}
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-14 rounded-full bg-[#7c3aed]/25 blur-[50px]" />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -inset-8 rounded-full bg-[#3b82f6]/20 blur-[30px]" />

            {/* Glass mic container */}
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(59,130,246,0.25) 50%, rgba(124,58,237,0.15) 100%)',
                border: '1.5px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 60px rgba(124,58,237,0.4), 0 0 120px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
              }}>
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
              {/* Glass highlight */}
              <div className="absolute top-2.5 left-3 w-[45%] h-[28%] rounded-full bg-white/[0.1] blur-[5px] rotate-[-15deg]" />
            </motion.div>
          </div>

          {/* Floating tech labels */}
          {[
            { label: 'Deepgram Nova-2', x: '-12%', y: '18%', color: '#3b82f6', d: 0 },
            { label: 'Groq LPU', x: '78%', y: '12%', color: '#7c3aed', d: 1.2 },
            { label: 'ElevenLabs TTS', x: '82%', y: '70%', color: '#ec4899', d: 2.4 },
            { label: 'Full-Duplex', x: '-8%', y: '72%', color: '#10b981', d: 3.6 },
            { label: '<400ms', x: '35%', y: '-5%', color: '#f59e0b', d: 0.8 },
          ].map((b, i) => (
            <motion.div key={`lb-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.85, 0.85, 0], scale: [0.85, 1, 1, 0.9], y: [4, 0, 0, -4] }}
              transition={{ duration: 5, repeat: Infinity, delay: b.d, ease: 'easeInOut' }}
              className="absolute px-3 py-1.5 rounded-xl border backdrop-blur-lg text-[10px] font-bold tracking-wider whitespace-nowrap z-30"
              style={{
                left: b.x, top: b.y,
                borderColor: `${b.color}30`, background: `${b.color}12`, color: `${b.color}cc`,
                boxShadow: `0 0 25px ${b.color}15, 0 4px 12px rgba(0,0,0,0.3)`,
              }}>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                {b.label}
              </span>
            </motion.div>
          ))}

          {/* Connection lines SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08] z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="8" y1="22" x2="45" y2="45" stroke="#3b82f6" strokeWidth="0.4" strokeDasharray="2 3" />
            <line x1="85" y1="16" x2="55" y2="45" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="2 3" />
            <line x1="88" y1="74" x2="55" y2="55" stroke="#ec4899" strokeWidth="0.4" strokeDasharray="2 3" />
            <line x1="8" y1="76" x2="45" y2="55" stroke="#10b981" strokeWidth="0.4" strokeDasharray="2 3" />
            <line x1="42" y1="2" x2="48" y2="42" stroke="#f59e0b" strokeWidth="0.4" strokeDasharray="2 3" />
          </svg>

          {/* Rising particles from model */}
          {[...Array(12)].map((_, i) => (
            <motion.div key={`mp-${i}`} initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0], y: [0, -80 - Math.random() * 100], x: [0, (Math.random() - 0.5) * 60] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4, ease: 'easeOut' }}
              className="absolute rounded-full z-10"
              style={{
                width: `${2 + Math.random() * 2}px`, height: `${2 + Math.random() * 2}px`,
                top: `${40 + Math.random() * 20}%`, left: `${30 + Math.random() * 40}%`,
                background: ['#7c3aed', '#3b82f6', '#ec4899', '#a78bfa'][i % 4],
                boxShadow: `0 0 6px ${['#7c3aed', '#3b82f6', '#ec4899', '#a78bfa'][i % 4]}60`,
              }} />
          ))}
        </motion.div>

        {/* ── Interactive Dashboard Preview ── */}
        <motion.div initial={{ opacity: 0, y: 100, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 1.4, ease }}
          className="relative z-20 w-full max-w-[960px] mt-10">
          <div className="absolute -inset-4 bg-gradient-to-b from-[#7c3aed]/15 via-[#3b82f6]/10 to-transparent rounded-[2.5rem] blur-3xl" />
          <div className="relative rounded-[28px] border border-white/[0.08] bg-[#0a0a0f]/80 backdrop-blur-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            {/* Window bar */}
            <div className="flex items-center px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.015]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#ff5f57] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#febb2e] transition-colors" />
                <div className="w-3 h-3 rounded-full bg-white/[0.08] hover:bg-[#28c840] transition-colors" />
              </div>
              <div className="mx-auto flex items-center gap-2 px-4 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <Lock className="w-3 h-3 text-white/20" />
                <span className="text-[12px] text-white/25 font-medium">app.vaaniai.com</span>
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
            <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/[0.04]">
              {tabs.map((f, i) => (
                <button key={i} onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                    activeTab === i ? 'bg-white/[0.06] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.02]'}`}>
                  <f.icon className="w-3.5 h-3.5" style={activeTab === i ? { color: f.color } : {}} />
                  {f.label}
                </button>
              ))}
            </div>
            {/* Content */}
            <div className="p-6 min-h-[240px] bg-gradient-to-b from-white/[0.01] to-transparent relative">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }} className="space-y-4">
                  {tabs[activeTab].lines.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: m.w === 'U' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.4 }}
                      className={`flex items-start gap-3 ${m.w === 'U' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                        m.w === 'AI' ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                        : m.w === 'U' ? 'bg-white/[0.08] text-white/60'
                        : 'bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa]'}`}>
                        {m.w === 'AI' ? <Bot className="w-3.5 h-3.5 text-white" /> : m.w === 'S' ? <Activity className="w-3.5 h-3.5" /> : 'U'}
                      </div>
                      <div className={`px-4 py-2.5 rounded-xl text-[13px] leading-relaxed max-w-md ${
                        m.w === 'AI' ? 'bg-[#7c3aed]/8 border border-[#7c3aed]/15 text-white/85 rounded-tl-sm'
                        : m.w === 'U' ? 'bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-tr-sm'
                        : 'bg-[#3b82f6]/5 border border-[#3b82f6]/10 text-[#93c5fd] font-mono text-[12px]'}`}>
                        {m.t}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
              {/* Waveform */}
              <div className="flex items-center gap-3 mt-5">
                <div className="flex items-end gap-[2px] h-4">
                  {[2,5,8,4,9,5,3,7,4,6,3,2,5,8,3,6].map((h, i) => (
                    <motion.div key={i} className="w-[2px] rounded-full"
                      style={{ background: `linear-gradient(to top, ${tabs[activeTab].color}40, ${tabs[activeTab].color})` }}
                      animate={{ height: [`${h * 1.5}px`, `${h * 3.5}px`, `${h * 1.5}px`] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }} />
                  ))}
                </div>
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[12px] font-mono tracking-wide" style={{ color: tabs[activeTab].color }}>
                  Processing · 120ms
                </motion.span>
              </div>
            </div>
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-t border-white/[0.04] bg-black/20 text-[11px] text-white/25 font-mono tracking-wider">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Groq LPU</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nova-2 STT</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Edge TTS</span>
              </div>
              <span className="text-white/30">Full-Duplex · Ultra Low Latency</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
            <motion.div animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-white/30" />
          </div>
        </motion.div>
      </section>

      {/* ── LOGOS / TRUST ────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <GlowLine />
        <div className="max-w-[1240px] mx-auto px-6 text-center py-16">
          <motion.p {...fadeUpInView()} className="text-[11px] text-white/25 font-semibold tracking-[0.25em] uppercase mb-12">Powering the next generation of voice AI</motion.p>
          <div className="flex overflow-hidden relative w-full">
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#030305] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#030305] to-transparent z-10" />
            <motion.div animate={{ x: [0, -1200] }} transition={{ repeat: Infinity, ease: 'linear', duration: 35 }}
              className="flex items-center gap-20 whitespace-nowrap">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-20">
                  {['Groq', 'Deepgram', 'ElevenLabs', 'Twilio', 'OpenAI', 'Anthropic', 'Google', 'Make.com', 'Zapier', 'n8n'].map(b => (
                    <span key={b} className="text-[18px] md:text-[22px] font-bold text-white/[0.12] tracking-tight hover:text-white/40 transition-colors duration-700 cursor-default">{b}</span>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        <GlowLine />
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#7c3aed]/5 blur-[200px] pointer-events-none rounded-full" />
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {[
            { num: 400, prefix: '<', suffix: 'ms', label: 'E2E Voice Latency' },
            { num: 30, suffix: '+', label: 'Native Languages' },
            { num: 99, suffix: '.99%', label: 'Infrastructure Uptime' },
            { num: 10, suffix: 'x', label: 'Cost Reduction' },
          ].map((s, i) => (
            <motion.div key={i} {...fadeUpInView(i * 0.08)}
              className="relative p-8 md:p-10 text-center rounded-3xl border border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#7c3aed]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7c3aed]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="text-[42px] md:text-[56px] font-black tracking-tighter bg-gradient-to-br from-white via-white/80 to-white/30 bg-clip-text text-transparent mb-2 relative z-10">
                <AnimatedCounter value={s.num} prefix={s.prefix || ''} suffix={s.suffix} />
              </p>
              <p className="text-[13px] text-white/35 font-medium tracking-wide relative z-10">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="product" className="py-32 px-6 relative">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute top-[50%] right-0 w-[500px] h-[500px] bg-[#3b82f6]/4 blur-[180px] rounded-full pointer-events-none" />
        <div className="max-w-[1240px] mx-auto">
          <motion.div {...fadeUpInView()} className="max-w-[640px] mb-20 text-center mx-auto">
            <p className="text-[12px] text-[#818cf8] font-bold tracking-[0.2em] uppercase mb-5">Platform Capabilities</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05] mb-6">
              Everything you need.<br />
              <span className="bg-gradient-to-r from-white/80 to-white/30 bg-clip-text text-transparent">Nothing you don't.</span>
            </h2>
            <p className="text-[16px] text-white/35 leading-relaxed font-light">One unified architecture. Any LLM, any voice, any language. Production-grade voice agents — zero compromise.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap,       title: 'Sub-400ms Latency',      desc: 'Full-duplex audio pipeline with intelligent VAD barge-in. Zero awkward silences.', accent: '#7c3aed' },
              { icon: Cpu,       title: 'Model Agnostic',          desc: 'Plug in Groq, OpenAI, Gemini, or any custom endpoint. Switch in one click.', accent: '#3b82f6' },
              { icon: Mic,       title: 'Multilingual STT',        desc: 'Hindi, Hinglish, English and 30+ languages via Deepgram Nova-2 with auto-detect.', accent: '#06b6d4' },
              { icon: Bot,       title: 'Visual Workflow Engine',   desc: 'Drag-and-drop call flow designer. Build complex IVR systems with zero code.', accent: '#ec4899' },
              { icon: Globe,     title: 'Webhooks & Integrations', desc: 'Auto-push transcripts, sentiment & structured data to n8n, Zapier, or your API.', accent: '#f59e0b' },
              { icon: BarChart3, title: 'Deep Analytics',          desc: 'QA scoring, sentiment timelines, call recordings and automatic CRM population.', accent: '#10b981' },
              { icon: Shield,    title: 'Enterprise Security',     desc: 'Role-based access control, team invites, API key encryption, per-org data isolation.', accent: '#8b5cf6' },
              { icon: Phone,     title: 'Native Telephony',        desc: 'Buy numbers, run outbound campaigns, handle inbound calls — all from one dashboard.', accent: '#ef4444' },
              { icon: Waves,     title: 'Smart Interruption',      desc: 'Agent listens while speaking. Natural human-like barge-in and turn-taking.', accent: '#14b8a6' },
            ].map((f, i) => (
              <motion.div key={i} {...fadeUpInView(i * 0.04)}>
                <SpotlightCard className="p-7 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:shadow-[0_0_25px_rgba(124,58,237,0.15)] transition-all duration-500">
                    <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-2.5 tracking-tight">{f.title}</h3>
                  <p className="text-[14px] text-white/35 leading-relaxed font-light">{f.desc}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ec4899]/4 blur-[180px] pointer-events-none rounded-full" />
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-[#ec4899] font-bold tracking-[0.2em] uppercase mb-5">Quick Integration</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05] mb-6">
              From zero to live<br />
              <span className="bg-gradient-to-r from-white/80 to-white/30 bg-clip-text text-transparent">in five minutes.</span>
            </h2>
            <p className="text-[16px] text-white/35 leading-relaxed font-light mb-10">We've abstracted the entire real-time voice pipeline into three simple steps. No WebRTC expertise needed.</p>

            <div className="flex flex-col gap-8">
              {[
                { n: '01', title: 'Configure LLM & Persona', desc: 'Choose Groq, OpenAI, or Gemini. Pick a voice from 30+ languages. Set the personality.', color: '#7c3aed' },
                { n: '02', title: 'Attach Knowledge & Tools', desc: 'Upload documents for RAG or connect your APIs via webhooks for real-time actions.', color: '#3b82f6' },
                { n: '03', title: 'Deploy & Scale', desc: 'Get a phone number instantly or embed our web widget. Auto-scales to thousands of concurrent calls.', color: '#ec4899' },
              ].map((s, i) => (
                <motion.div key={i} {...fadeUpInView(i * 0.12)} className="flex gap-5 group">
                  <div className="relative flex flex-col items-center">
                    <div className="w-11 h-11 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-[13px] font-bold text-white/40 group-hover:text-white group-hover:border-white/20 transition-all z-10 relative"
                      style={{ ['--hover-shadow' as string]: `0 0 25px ${s.color}30` }}>
                      <span className="group-hover:opacity-0 transition-opacity">{s.n}</span>
                      <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${s.color}15, transparent)` }} />
                      <div className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                    </div>
                    {i !== 2 && <div className="w-px h-full bg-gradient-to-b from-white/[0.08] to-transparent mt-1 group-hover:from-white/20 transition-colors" />}
                  </div>
                  <div className="pt-2 pb-2">
                    <h3 className="text-[16px] font-bold mb-1.5 tracking-tight text-white/90">{s.title}</h3>
                    <p className="text-[14px] text-white/35 leading-relaxed font-light">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Architecture visualization */}
          <motion.div {...fadeUpInView(0.2)} className="relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/10 to-[#ec4899]/10 blur-[100px] rounded-full" />
            <div className="relative p-1.5 rounded-3xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-xl shadow-2xl">
              <div className="rounded-[20px] overflow-hidden border border-white/[0.04] bg-[#080810] p-8 h-[440px] flex flex-col justify-center items-center relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Orbiting rings */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className="w-52 h-52 rounded-full border border-dashed border-white/[0.06] absolute" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                  className="w-36 h-36 rounded-full border border-dashed border-[#ec4899]/15 absolute" />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  className="w-72 h-72 rounded-full border border-dashed border-white/[0.03] absolute" />

                {/* Orbiting nodes */}
                {[
                  { label: 'STT', color: '#3b82f6', size: 64, delay: 0 },
                  { label: 'LLM', color: '#7c3aed', size: 72, delay: -10 },
                  { label: 'TTS', color: '#ec4899', size: 64, delay: -20 },
                ].map((node, idx) => (
                  <motion.div key={idx} animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: node.delay }}
                    className="absolute" style={{ width: node.size * 3.5, height: node.size * 3.5 }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider"
                      style={{ borderColor: `${node.color}30`, background: `${node.color}10`, color: `${node.color}cc`, boxShadow: `0 0 20px ${node.color}15` }}>
                      <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear', delay: node.delay }}>
                        {node.label}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* Center core */}
                <div className="relative z-10">
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_0_40px_rgba(124,58,237,0.4)] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/20 blur-xl -z-10" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────── */}
      <section id="developers" className="py-32 px-6 relative">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="max-w-[1240px] mx-auto text-center">
          <motion.div {...fadeUpInView()}>
            <p className="text-[12px] text-white/25 font-bold tracking-[0.2em] uppercase mb-5">Ecosystem</p>
            <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.03em] mb-4">Plug into your existing stack</h2>
            <p className="text-[16px] text-white/30 font-light mb-14 max-w-[500px] mx-auto">First-class integrations with the tools you already use.</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-[900px] mx-auto">
              {['Groq', 'OpenAI', 'Gemini', 'Anthropic', 'Deepgram', 'ElevenLabs', 'Azure', 'Twilio', 'n8n', 'Zapier', 'Make.com', 'WhatsApp', 'Salesforce', 'HubSpot', 'Zendesk', 'Stripe', 'Slack', 'Google Calendar'].map((t, i) => (
                <motion.div key={t} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.04 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.02, duration: 0.3 }}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[13px] font-medium text-white/45 hover:border-[#7c3aed]/30 hover:text-white/80 hover:bg-[#7c3aed]/5 hover:shadow-[0_0_25px_rgba(124,58,237,0.1)] transition-all cursor-default backdrop-blur-md">
                  {t}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed]/5 blur-[200px] rounded-full pointer-events-none" />
        <div className="max-w-[1100px] mx-auto relative z-10">
          <motion.div {...fadeUpInView()} className="text-center mb-16">
            <p className="text-[12px] text-[#a78bfa] font-bold tracking-[0.2em] uppercase mb-5">Pricing</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05] mb-4">
              Enterprise features.<br />
              <span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">Open source pricing.</span>
            </h2>
            <p className="text-[16px] text-white/30 font-light max-w-[460px] mx-auto">Every feature that costs $3,000+/mo elsewhere is free on VaaniAI. Forever.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: 'Free', desc: 'Perfect for testing & prototyping', features: ['100 minutes/month', 'Groq LLM (free tier)', 'Edge TTS (unlimited)', '1 agent', 'Web widget', 'Community support'], cta: 'Get started', primary: false },
              { name: 'Pro', price: 'Free', desc: 'For production deployments', features: ['Unlimited minutes', 'All LLM providers', 'All TTS providers', 'Unlimited agents', 'Phone numbers', 'Campaigns & analytics', 'RAG & knowledge base', 'Priority support'], cta: 'Start building', primary: true },
              { name: 'Enterprise', price: 'Free', desc: 'Full platform access', features: ['Everything in Pro', 'Custom SIP trunking', 'RBAC & team management', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations', 'White-label option', '24/7 support'], cta: 'Contact us', primary: false },
            ].map((plan, i) => (
              <motion.div key={i} {...fadeUpInView(i * 0.1)}
                className={`relative p-8 rounded-3xl border backdrop-blur-md transition-all duration-500 group ${
                  plan.primary
                    ? 'border-[#7c3aed]/30 bg-gradient-to-b from-[#7c3aed]/[0.08] to-[#030305] shadow-[0_0_50px_rgba(124,58,237,0.1)]'
                    : 'border-white/[0.06] bg-white/[0.015] hover:border-white/[0.1]'
                }`}>
                {plan.primary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] text-[11px] font-bold tracking-wider text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-[18px] font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[42px] font-black tracking-tight">{plan.price}</span>
                  <span className="text-[14px] text-white/30 font-medium">/forever</span>
                </div>
                <p className="text-[14px] text-white/35 mb-6 font-light">{plan.desc}</p>
                <Link href="/auth/register">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all mb-8 ${
                      plan.primary
                        ? 'bg-white text-[#030305] shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]'
                        : 'border border-white/[0.1] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white'
                    }`}>
                    {plan.cta}
                  </motion.button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-[13px] text-white/45 font-light">
                      <div className="w-1 h-1 rounded-full bg-[#7c3aed]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="max-w-[1240px] mx-auto">
          <motion.div {...fadeUpInView()} className="text-center mb-16">
            <p className="text-[12px] text-white/25 font-bold tracking-[0.2em] uppercase mb-5">Testimonials</p>
            <h2 className="text-[40px] md:text-[56px] font-extrabold tracking-[-0.03em]">Built for massive scale.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: 'We replaced our entire inbound support team with VaaniAI agents. Response time went from hours to seconds.', name: 'Rahul S.', role: 'CTO, TechStartup', gradient: 'from-[#7c3aed] to-[#3b82f6]' },
              { quote: 'The Hindi + English multilingual support is incredible. Our Hindi-speaking customers finally feel heard.', name: 'Priya M.', role: 'Product Lead, FinTech', gradient: 'from-[#3b82f6] to-[#06b6d4]' },
              { quote: 'Webhook integration means every call auto-populates our CRM. Zero manual data entry. Absolutely incredible.', name: 'Amit K.', role: 'Ops Manager, D2C Brand', gradient: 'from-[#ec4899] to-[#7c3aed]' },
            ].map((t, i) => (
              <motion.div key={i} {...fadeUpInView(i * 0.1)}
                className="relative p-7 rounded-3xl border border-white/[0.06] bg-white/[0.015] hover:-translate-y-1 transition-all duration-500 group">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#7c3aed]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />)}
                </div>
                <p className="text-[15px] text-white/55 leading-relaxed mb-7 font-light">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${t.gradient} flex items-center justify-center text-[13px] font-bold shadow-lg`}>{t.name[0]}</div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/80">{t.name}</p>
                    <p className="text-[11px] text-white/30">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-[#7c3aed]/10 via-[#3b82f6]/5 to-transparent blur-[120px]" />
        </div>

        <motion.div {...fadeUpInView()} className="max-w-[800px] mx-auto text-center relative z-10">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] shadow-[0_0_60px_rgba(124,58,237,0.3)] flex items-center justify-center mx-auto mb-10">
            <Mic className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-[48px] md:text-[72px] font-black tracking-[-0.04em] leading-[0.92] mb-8">
            Ready to deploy your<br />
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#818cf8] to-[#60a5fa] bg-clip-text text-transparent">first voice agent?</span>
          </h2>
          <p className="text-[18px] text-white/30 mb-12 leading-relaxed font-light max-w-[480px] mx-auto">
            Get started in under 5 minutes. No credit card. No usage limits. Just build.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="group flex items-center gap-2.5 px-10 py-5 rounded-full bg-white text-[#030305] font-bold text-[16px] shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.25)] transition-all">
                Start building for free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-10 py-5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[16px] text-white/50 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.15] transition-all font-medium backdrop-blur-md">
                Sign in to dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="relative">
        <GlowLine />
        <div className="max-w-[1240px] mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[16px] font-bold">Vaani<span className="text-[#a78bfa]">AI</span></span>
              </Link>
              <p className="text-[13px] text-white/25 leading-relaxed font-light">The open-source voice AI platform. Enterprise features, zero cost.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { title: 'Developers', links: ['Documentation', 'API Reference', 'SDKs', 'Status'] },
              { title: 'Company', links: ['About', 'Blog', 'Twitter', 'GitHub'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[12px] font-semibold text-white/40 tracking-[0.15em] uppercase mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-[13px] text-white/20 hover:text-white/50 transition-colors font-light">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
            <p className="text-[12px] text-white/15 font-light">&copy; 2026 VaaniAI. All rights reserved.</p>
            <div className="flex gap-6 text-[12px] text-white/15">
              {['Privacy', 'Terms', 'Cookies'].map(l => (
                <a key={l} href="#" className="hover:text-white/40 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
