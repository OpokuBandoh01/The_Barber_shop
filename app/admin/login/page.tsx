'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, ShieldAlert, Scissors, User, Mail, UserPlus, CheckCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  
  // Credentials
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Check setup requirement on load
  const checkSetup = async () => {
    try {
      const res = await fetch('/api/admin/setup-check')
      if (res.ok) {
        const data = await res.json()
        setSetupRequired(data.setupRequired)
      } else {
        setSetupRequired(false) // fallback to login
      }
    } catch (err) {
      console.error('Failed to check setup state', err)
      setSetupRequired(false)
    }
  }

  useEffect(() => {
    checkSetup()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || 'Invalid email or password.')
      }
    } catch (err) {
      setError('An error occurred during authentication. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), password }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage('Administrator registered successfully! Please sign in with your credentials.')
        setName('')
        setPassword('')
        setConfirmPassword('')
        setSetupRequired(false)
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  // Render a loading state while checking database setup requirement
  if (setupRequired === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Checking system state...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/5">
          <Scissors className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">The Barber Shop</h1>
        <p className="text-slate-400 text-sm mt-1.5 font-medium">Secure Admin Control Panel</p>
      </div>

      <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur border-slate-700 shadow-2xl">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
            {setupRequired ? (
              <>
                <UserPlus className="w-5 h-5 text-amber-500" /> Set Up Admin Account
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-amber-500" /> Admin Sign In
              </>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs text-center">
            {setupRequired 
              ? 'Configure your initial administrator credentials to get started.' 
              : 'Access is restricted to authorized personnel only.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {setupRequired ? (
            /* REGISTRATION SETUP FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Full Name</label>
                  <div className="relative">
                    <Input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 focus-visible:ring-amber-500"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Email Address</label>
                  <div className="relative">
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@barbershop.com"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 focus-visible:ring-amber-500"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Create Password</label>
                  <div className="relative">
                    <Input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 pr-10 focus-visible:ring-amber-500 font-mono"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Confirm Password</label>
                  <div className="relative">
                    <Input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 pr-10 focus-visible:ring-amber-500 font-mono"
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 text-sm shadow-lg shadow-amber-600/10 active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Admin & Login'
                )}
              </Button>
            </form>
          ) : (
            /* STANDARD LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@barbershop.com"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 focus-visible:ring-amber-500"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Password</label>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pl-10 pr-10 focus-visible:ring-amber-500 font-mono"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 text-sm shadow-lg shadow-amber-600/10 active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
