'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Phone, Mail, Lock, Eye, EyeOff, ArrowRight, User, Sparkles, Check } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const passwordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const data: any = await authApi.register(form.name, form.email, form.password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/15 to-cyan-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-thin tracking-wide text-slate-900 dark:text-white">
              Vaani<span className="font-extralight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 pt-20 py-10">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-xl" />
            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-2xl shadow-purple-500/5">
              
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/10 to-pink-600/10 border border-purple-200/50 dark:border-purple-800/50 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-light text-purple-700 dark:text-purple-300">Join VaaniAI for free</span>
                </div>
                <h1 className="text-3xl font-thin text-slate-900 dark:text-white mb-2">Create account</h1>
                <p className="text-slate-500 dark:text-slate-400 font-light">Your AI voice platform awaits</p>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {['Free to start', 'No credit card', 'Instant access'].map((b) => (
                  <div key={b} className="flex items-center gap-1 text-xs font-light text-slate-600 dark:text-slate-400">
                    <Check className="w-3 h-3 text-green-500" />{b}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-light">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-light text-slate-700 dark:text-slate-300">Full name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      id="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="pl-11 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-2xl font-light"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-light text-slate-700 dark:text-slate-300">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="pl-11 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-2xl font-light"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-light text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className="pl-11 pr-11 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/20 rounded-2xl font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {form.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs font-light text-slate-500">{strengthLabels[strength]}</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-light text-slate-700 dark:text-slate-300">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      id="confirm-password"
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      className={`pl-11 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-purple-400/20 rounded-2xl font-light ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-red-400 focus:border-red-400'
                          : 'focus:border-purple-400'
                      }`}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  id="register-submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 text-white font-light text-base shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] rounded-2xl disabled:opacity-70 disabled:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-slate-500 dark:text-slate-400 font-light text-sm">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/auth/login"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-light text-sm transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
