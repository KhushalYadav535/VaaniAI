'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Phone, Zap, BarChart3, Shield, 
  MessageSquare, Mic, Headphones, Cpu, Globe, 
  Lock, Play, Sparkles, Star, Layers, MousePointer2,
  ChevronDown, CheckCircle2, Waves, Sparkle, Fingerprint, Activity
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

// --- 3D Interactive Tilt Card ---
function TiltCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`relative group ${className}`}
    >
      <div 
        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
        className="w-full h-full relative border border-slate-200 dark:border-white/10 rounded-3xl bg-white/70 dark:bg-black/50 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(147,51,234,0.1)] overflow-hidden transition-colors"
      >
        {/* Dynamic Glare Effect */}
        <motion.div 
          className="absolute inset-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: useTransform(
              () => `radial-gradient(circle at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.2) 0%, transparent 60%)`
            )
          }}
        />
        {children}
      </div>
    </motion.div>
  );
}

// --- 3D Floor Grid ---
const GridFloor = () => (
  <div className="absolute top-0 left-0 w-full h-[150vh] -z-10 overflow-hidden pointer-events-none perspective-[1200px]">
    <motion.div 
      initial={{ rotateX: 75, y: 300, scale: 2 }}
      animate={{ backgroundPosition: ['0px 0px', '0px 120px'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      className="absolute bottom-[-20vh] left-[-50vw] w-[200vw] h-[150vh] origin-top opacity-30 dark:opacity-50"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(147, 51, 234, 0.15) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(147, 51, 234, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '120px 120px',
        transformStyle: "preserve-3d",
        maskImage: 'linear-gradient(to bottom, transparent 10%, black 40%, transparent 90%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 10%, black 40%, transparent 90%)',
      }}
    />
  </div>
);

// --- Floating 3D Elements ---
const FloatingHeroOrbs = () => (
  <div className="absolute inset-0 pointer-events-none perspective-1000 -z-5">
    <motion.div
      animate={{ 
        rotateY: 360, rotateX: 360,
        y: [-20, 20, -20], x: [-10, 10, -10]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[20%] left-[20%] w-32 h-32 rounded-full border-[10px] border-purple-500/20 backdrop-blur-md shadow-[0_0_40px_rgba(147,51,234,0.3)] hidden md:block"
      style={{ transformStyle: 'preserve-3d' }}
    />
    <motion.div
      animate={{ 
        rotateY: -360, rotateZ: 360,
        y: [20, -20, 20], x: [10, -10, 10]
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="absolute top-[40%] right-[15%] w-48 h-48 rounded-full border-[2px] border-blue-500/30 backdrop-blur-3xl shadow-[0_0_60px_rgba(59,130,246,0.2)] bg-blue-500/5 hidden md:block"
      style={{ transformStyle: 'preserve-3d' }}
    />
    {/* Center Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-purple-600/15 dark:bg-purple-900/30 rounded-full blur-[120px] mix-blend-screen" />
  </div>
);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: mounted ? containerRef : undefined,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scroll animations for Hero
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.8]);
  const heroZ = useTransform(smoothProgress, [0, 0.15], [0, -300]);
  const heroRotateX = useTransform(smoothProgress, [0, 0.15], [0, 20]);

  if (!mounted) return <div className="min-h-screen bg-[#030303]" />;

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-[#030303] text-slate-900 dark:text-white selection:bg-purple-500/30 overflow-x-hidden font-sans">
      
      {/* Universal Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.025] dark:opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 z-[200] origin-left drop-shadow-[0_0_10px_rgba(147,51,234,0.8)]"
        style={{ scaleX: smoothProgress }}
      />

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className="fixed top-0 w-full bg-white/40 dark:bg-[#030303]/40 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 z-50 transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group perspective-1000">
            <motion.div 
              whileHover={{ rotateY: 180, scale: 1.1 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)]"
            >
              <Mic className="w-5 h-5 text-white" style={{ transform: "translateZ(10px)" }} />
            </motion.div>
            <span className="text-2xl font-black tracking-tighter mix-blend-difference">
              VAANI<span className="text-purple-600 dark:text-purple-400">AI</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-600 dark:text-white/50">
            {['Engine', 'Features', 'API'].map((item) => (
              <motion.a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                whileHover={{ y: -2, color: 'rgb(168, 85, 247)' }}
                className="transition-colors hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" className="hover:bg-slate-200 dark:hover:bg-white/10 rounded-full px-6 font-bold uppercase text-[11px] tracking-[0.1em]">Login</Button>
            </Link>
            <Link href="/auth/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-slate-900 border border-slate-700 dark:bg-white dark:border-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full px-8 font-black uppercase text-[11px] tracking-[0.1em] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  Start Building
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center z-10 perspective-1000 overflow-hidden">
        <GridFloor />
        <FloatingHeroOrbs />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, z: heroZ, rotateX: heroRotateX, transformStyle: "preserve-3d" }}
          className="relative z-10 max-w-6xl w-full flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/50 dark:bg-purple-500/10 border border-slate-200 dark:border-purple-500/20 backdrop-blur-xl text-[11px] font-black uppercase tracking-[0.3em] text-purple-700 dark:text-purple-300 mb-10 shadow-xl"
            style={{ transform: "translateZ(40px)" }}
          >
            <Sparkle className="w-3.5 h-3.5 animate-pulse" />
            <span>The Era of Conversational AI</span>
          </motion.div>

          {/* 3D Headline */}
          <motion.div 
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
             className="relative"
          >
            <h1 
              className="text-6xl sm:text-8xl md:text-[140px] font-black tracking-tighter leading-[0.8] mb-8"
              style={{ transform: "translateZ(80px)" }}
            >
              SPEAK <br />
              <motion.span 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="bg-gradient-to-r from-purple-600 via-blue-500 to-pink-500 bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(147,51,234,0.4)]"
              >
                TO EXISTENCE.
              </motion.span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            style={{ transform: "translateZ(60px)" }}
            className="text-lg md:text-2xl text-slate-600 dark:text-white/60 mb-14 max-w-2xl leading-relaxed font-medium mx-auto"
          >
            Deploy sub-500ms voice agents that reason, interrupt, and converse with human-level naturalness.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring" }}
            style={{ transform: "translateZ(90px)" }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full"
          >
            <Link href="/auth/register">
              <Button size="lg" className="h-16 px-10 bg-purple-600 hover:bg-purple-700 text-white text-sm font-black uppercase tracking-[0.1em] rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Deploy Your Agent <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-16 px-10 border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-sm font-black uppercase tracking-[0.1em] rounded-2xl backdrop-blur-xl transition-all hover:scale-105 group shadow-lg">
              <Play className="mr-3 w-4 h-4 fill-current group-hover:text-purple-500 transition-colors" /> View Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating 3D Cards - "Mockup" replacement */}
        <motion.div 
          initial={{ opacity: 0, y: 100, rotateX: 40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          className="mt-32 w-full max-w-6xl relative perspective-1000 z-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 relative" style={{ transformStyle: 'preserve-3d' }}>
            {[
              { title: "Low Latency", icon: Zap, value: "< 500ms", color: "text-yellow-500", shadow: "shadow-yellow-500/20" },
              { title: "Reasoning", icon: Cpu, value: "Llama 3", color: "text-purple-500", shadow: "shadow-purple-500/20" },
              { title: "Duplex", icon: Waves, value: "Real-time", color: "text-blue-500", shadow: "shadow-blue-500/20" }
            ].map((stat, i) => (
               <TiltCard key={i} className="h-48 group">
                 <div className="p-8 flex flex-col justify-between h-full relative z-10">
                   <div className="flex justify-between items-start" style={{ transform: "translateZ(20px)" }}>
                     <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-inner flex items-center justify-center border border-slate-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-500`}>
                       <stat.icon className={`w-6 h-6 ${stat.color}`} />
                     </div>
                     <Activity className={`w-6 h-6 ${stat.color} opacity-50`} />
                   </div>
                   <div style={{ transform: "translateZ(40px)" }}>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mb-1">{stat.title}</p>
                     <p className="text-3xl font-black">{stat.value}</p>
                   </div>
                 </div>
               </TiltCard>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Cinematic Features Section */}
      <section id="features" className="py-40 px-6 relative bg-white dark:bg-transparent transition-colors duration-500 mix-blend-normal">
        <div className="max-w-7xl mx-auto relative z-10 perspective-1000">
          <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-center mb-32"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              FLAWLESS <br /> <span className="text-slate-300 dark:text-white/10">EXECUTION.</span>
            </h2>
            <p className="text-slate-500 dark:text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              We built an architecture that eliminates the awkward pauses. VAD, TTS, and LLM streamed synchronously.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* 3D Wireframe / Interactive visual */}
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="relative h-[500px] rounded-[40px] border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-center overflow-hidden group shadow-2xl"
            >
              {/* Animated rings */}
              <motion.div 
                animate={{ rotateX: 360, rotateZ: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[150%] h-[150%] border border-purple-500/20 rounded-[40%] mix-blend-screen"
                style={{ borderStyle: 'dashed' }}
              />
              <motion.div 
                animate={{ rotateY: 360, rotateZ: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[120%] h-[120%] border border-blue-500/20 rounded-[45%] mix-blend-screen"
                style={{ borderStyle: 'dotted' }}
              />
              
              {/* Core Pulse */}
              <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_80px_rgba(147,51,234,0.6)] group-hover:scale-110 transition-transform duration-700">
                <Mic className="w-12 h-12 text-white" />
                <motion.div 
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-purple-500"
                />
              </div>

              <div className="absolute bottom-10 left-10 right-10 bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 p-6 rounded-3xl" style={{ transform: "translateZ(50px)" }}>
                 <div className="flex items-center gap-4 mb-2">
                   <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-xs font-bold uppercase tracking-widest">Live Stream</span>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                   <motion.div 
                     animate={{ width: ["10%", "90%", "10%"] }}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                     className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                   />
                 </div>
              </div>
            </motion.div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                { icon: Zap, title: 'Edge Optimized', desc: 'Deploy across multiple regions for global low latency.' },
                { icon: Shield, title: 'Enterprise Security', desc: 'SOC2 Type II compliant with end-to-end encryption.' },
                { icon: Fingerprint, title: 'Voice Cloning', desc: 'Create hyper-realistic custom voices in minutes.' }
              ].map((feat, i) => (
                <TiltCard key={i} className="w-full">
                  <div className="p-8 flex items-start gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex flex-shrink-0 items-center justify-center" style={{ transform: "translateZ(30px)" }}>
                      <feat.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div style={{ transform: "translateZ(40px)" }}>
                      <h4 className="text-xl font-black mb-2 tracking-tight">{feat.title}</h4>
                      <p className="text-slate-500 dark:text-white/50 text-sm font-medium leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Code / Developer Section with 3D Depth */}
      <section id="engine" className="py-40 px-6 relative overflow-hidden bg-slate-900 dark:bg-[#050505] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10 leading-[0.9]">
              BUILT FOR <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">BUILDERS.</span>
            </h2>
            <div className="space-y-8">
              {[
                'Full Duplex Audio Streams',
                'Advanced Function Calling',
                'Custom Vector Knowledge Base',
                'Webhooks & Analytics API'
              ].map((text, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-bold text-white/80">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* 3D Code Editor */}
          <motion.div 
            initial={{ opacity: 0, rotateY: 20, rotateX: 10 }}
            whileInView={{ opacity: 1, rotateY: -10, rotateX: 5 }}
            transition={{ duration: 1, type: "spring" }}
            className="relative perspective-2000"
          >
            <div className="absolute inset-0 bg-blue-600/30 blur-[120px] rounded-full" />
            
            <TiltCard className="w-full relative z-10 border border-white/10 !bg-black/80 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
              <div className="p-8">
                {/* Mac window dots */}
                <div className="flex gap-2 mb-8" style={{ transform: "translateZ(20px)" }}>
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                
                <pre className="font-mono text-sm leading-loose overflow-x-auto" style={{ transform: "translateZ(40px)" }}>
                  <code className="text-white/70">
                    <span className="text-purple-400">const</span> agent = <span className="text-purple-400">await</span> <span className="text-blue-400">VaaniAI</span>.<span className="text-yellow-200">createAgent</span>({`{`}<br/>
                    &nbsp;&nbsp;name: <span className="text-green-400">"Sales Rep"</span>,<br/>
                    &nbsp;&nbsp;voice: <span className="text-green-400">"ElevenLabs.Jenny"</span>,<br/>
                    &nbsp;&nbsp;model: <span className="text-green-400">"Llama-3.3-70b-versatile"</span>,<br/>
                    &nbsp;&nbsp;tools: [<span className="text-green-400">"calendar_booking"</span>],<br/>
                    &nbsp;&nbsp;streaming: <span className="text-orange-400">true</span><br/>
                    {`}`});<br/><br/>
                    agent.<span className="text-yellow-200">on</span>(<span className="text-green-400">'interruption'</span>, () <span className="text-purple-400">{`=>`}</span> {`{`}<br/>
                    &nbsp;&nbsp;<span className="text-blue-400">console</span>.<span className="text-yellow-200">log</span>(<span className="text-green-400">'User barged in, stopping TTS.'</span>);<br/>
                    {`}`});
                  </code>
                </pre>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - The "Luxurious" Finale */}
      <section className="py-48 px-6 perspective-1000">
        <motion.div 
          initial={{ opacity: 0, y: 100, rotateX: 30 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-[60px] md:rounded-[100px] blur-[150px] opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
          
          <TiltCard className="w-full !rounded-[60px] md:!rounded-[100px] !bg-white/80 dark:!bg-black/60 !border-white/20">
            <div className="p-20 md:py-32 md:px-20 text-center relative z-10 overflow-hidden">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                 className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" 
               />

               <div style={{ transform: "translateZ(80px)" }}>
                 <h2 className="text-5xl md:text-[130px] font-black tracking-tighter mb-12 leading-[0.8] transition-all group-hover:tracking-tight duration-700 mx-auto">
                   CREATE <br /> <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">MAGIC.</span>
                 </h2>

                 <div className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
                   <Link href="/auth/register">
                     <Button size="lg" className="h-16 md:h-20 px-12 md:px-16 bg-slate-900 border border-slate-700 dark:bg-white dark:border-white text-white dark:text-black hover:scale-110 text-sm md:text-xl font-black uppercase tracking-[0.1em] rounded-[2rem] shadow-2xl transition-all active:scale-95">
                       DEPLOY NOW
                     </Button>
                   </Link>
                 </div>
               </div>
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-200/50 dark:border-white/5 bg-slate-100 dark:bg-black transition-colors duration-500 mix-blend-normal">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <Mic className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-black tracking-tighter">VAANI<span className="text-purple-600">AI</span></span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30">
            {['Privacy', 'Research', 'Status', 'Twitter'].map(link => (
              <a key={link} href="#" className="hover:text-purple-600 dark:hover:text-white transition-colors">{link}</a>
            ))}
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20">
            © 2026 VAANIAI
          </p>
        </div>
      </footer>
    </div>
  );
}
