'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white cursor-pointer hover:text-amber-500 transition">
              The Barber Shop
            </h1>
          </Link>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/admin" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 border border-slate-600 text-white hover:bg-slate-700 transition-colors">
              Admin Portal
            </Link>
            <Link href="/admin" className="sm:hidden inline-flex items-center justify-center rounded-md w-10 h-10 border border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors" title="Admin Portal">
              <Lock className="w-4 h-4" />
            </Link>
            <Link href="/queue" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 border border-slate-600 text-white hover:bg-slate-700 transition-colors">
              View Queue
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-5xl font-bold text-white mb-6">Premium Barbershop Experience</h2>
            <p className="text-xl text-slate-300 mb-4">
              Book your appointment online and skip the wait. Check our live queue to see wait times in real-time.
            </p>
            <p className="text-slate-400 mb-8">
              Classic cuts, professional grooming, and exceptional service. We&apos;re open Monday-Saturday.
            </p>

            <div className="flex gap-4 flex-wrap sm:flex-nowrap">
              <Link href="/bookings" className="inline-flex items-center justify-center rounded-md text-lg font-semibold h-12 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white transition-colors w-full sm:w-auto text-center">
                Book Now
              </Link>
              <Link href="/queue" className="inline-flex items-center justify-center rounded-md text-lg font-semibold h-12 px-8 py-3 border border-amber-600 text-amber-600 hover:bg-amber-600/10 transition-colors w-full sm:w-auto text-center">
                Check Queue
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-amber-500">Easy Booking</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                Choose your date, time, and service. Get instant confirmation and manage all your bookings in one place.
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-amber-500">Live Queue Updates</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                See exactly where you are in the queue and estimated wait times. No more guessing!
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-amber-500">Flexible Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                Cancel or reschedule your appointment anytime. We&apos;re here to work around your schedule.
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-500">10+</p>
            <p className="text-slate-400">Years Experience</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-500">500+</p>
            <p className="text-slate-400">Happy Customers</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-500">5★</p>
            <p className="text-slate-400">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-amber-500">100%</p>
            <p className="text-slate-400">Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  )
}
