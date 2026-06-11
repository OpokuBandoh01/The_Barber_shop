'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border border-slate-500 animate-pulse" />
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-10 h-10 rounded-full border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/50 text-amber-500 hover:text-amber-400 focus-visible:ring-1 focus-visible:ring-amber-500 transition-all duration-300 shadow-sm"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      id="theme-toggle"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 hover:-rotate-12" />
      )}
    </Button>
  )
}
