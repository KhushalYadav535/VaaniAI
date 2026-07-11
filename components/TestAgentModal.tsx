'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Key, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { visitorsApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function TestAgentModal({ isOpen, onClose, agentId }: { isOpen: boolean, onClose: () => void, agentId?: string | null }) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setStep('email')
      setEmail('')
      setOtp('')
      setError('')
      setResendTimer(0)
    }
  }, [isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await visitorsApi.sendOtp(email)
      setStep('otp')
      setResendTimer(60) // 60 seconds cooldown for resend
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return
    setLoading(true)
    setError('')
    try {
      const res: any = await visitorsApi.verifyOtp(email, otp)
      localStorage.setItem('visitorToken', res.token)
      onClose()
      if (agentId) {
        router.push(`/test-agent?agentId=${agentId}`)
      } else {
        router.push('/test-agent')
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white/80 dark:bg-[#0a0b0f]/80 backdrop-blur-2xl border-slate-200/50 dark:border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-cyan-500/5 pointer-events-none" />
        
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-light tracking-tight text-slate-900 dark:text-white">
              Try <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-500">Vocred</span> Agent
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-light">
              Experience the next generation of voice AI
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-light text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp} 
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    <Input
                      type="email"
                      placeholder="Enter your email to continue"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-11 rounded-2xl bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all text-base placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 font-medium text-base" 
                  disabled={loading || !email}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Continue with Email <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Verification Code
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    We sent a 6-digit code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
                  </p>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="h-12 pl-11 rounded-2xl bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all text-base tracking-[0.2em] font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 font-medium text-base" 
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Verify & Start Testing
                  </Button>

                  <div className="flex items-center justify-between text-sm mt-2">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={resendTimer > 0 || loading}
                      className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors flex items-center disabled:opacity-50 disabled:hover:text-violet-600 dark:disabled:hover:text-violet-400"
                    >
                      {resendTimer > 0 ? (
                        `Resend in ${resendTimer}s`
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resend OTP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
