'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff, ShieldAlert, Scissors } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || 'Authentication failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred during authentication. Please check your connection.')
    } finally {
      setLoading(false)
    }
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
            <Lock className="w-5 h-5 text-amber-500" /> Enter Passcode
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs text-center">
            Access to this section is restricted to authorized personnel only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                required
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11 pr-10 focus-visible:ring-amber-500 font-mono text-center tracking-widest text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 text-sm shadow-lg shadow-amber-600/10 active:scale-[0.98]"
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
        </CardContent>
      </Card>
    </div>
  )
}
