'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Users, Scissors } from 'lucide-react'
import { type Booking, type Service } from '@/lib/mock-data'
import { ThemeToggle } from '@/components/theme-toggle'

export default function QueuePage() {
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])

  const fetchData = async () => {
    try {
      const [bookingsRes, servicesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/services')
      ])
      if (bookingsRes.ok && servicesRes.ok) {
        const bookingsData = await bookingsRes.json()
        const servicesData = await servicesRes.json()
        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData)
        }
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          setServices(servicesData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch queue data:', error)
    }
  }

  useEffect(() => {
    fetchData()
    setMounted(true)

    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const timeToMinutes = (t: string) => {
    const [timePart, modifier] = t.split(' ')
    let [hours, minutes] = timePart.split(':').map(Number)
    if (modifier === 'PM' && hours < 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  // Filter and sort bookings for selected date (exclude Cancelled and Completed from the live queue)
  const queue = bookings
    .filter(b => b.date === selectedDate && b.status !== 'Cancelled' && b.status !== 'Completed')
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .map((b, index) => {
      let estimatedTime = ''
      if (index === 0) {
        estimatedTime = 'Immediate'
      } else {
        estimatedTime = `~${index * 25} mins`
      }
      return {
        id: b.id,
        position: index + 1,
        clientName: b.name.split(' ').map((n, i, arr) => i === arr.length - 1 ? n[0] + '.' : n).join(' '), // Mask last name: e.g. Liam N.
        timeSlot: b.time,
        serviceType: services.find(s => s.id === b.service)?.name || b.service,
        estimatedTime
      }
    })

  // Calculations for stats
  const totalWaiting = queue.length
  const activeServing = queue.length > 0 ? queue[0].clientName : 'None'
  const activeServiceType = queue.length > 0 ? queue[0].serviceType : 'No active appointments'
  const estWaitNewClient = totalWaiting * 25

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Loading live queue...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-xl font-bold text-white hover:text-amber-500 transition cursor-pointer">
              The Barber Shop
            </h1>
          </Link>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/bookings" className="inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white transition-colors">
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Live Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time status of scheduled appointments</p>
          </div>
          <div>
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-white p-0 text-sm h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-32 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Now Serving</span>
                <p className="text-base font-bold text-white truncate mt-0.5">{activeServing}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{activeServiceType}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total in Line</span>
                <p className="text-base font-bold text-white mt-0.5">{totalWaiting} client{totalWaiting !== 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-400 mt-0.5">Pending appointments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Est. Wait (New Client)</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {totalWaiting === 0 ? 'Immediate' : `~${estWaitNewClient} mins`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Based on 25m avg cut</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        {queue.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardContent className="py-16 text-center">
              <p className="text-slate-400 font-medium">Queue is empty for this date</p>
              <p className="text-slate-500 text-sm mt-1.5">All appointments have been completed, cancelled, or none are booked.</p>
              <Link href="/bookings" className="inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white transition-colors mt-5">
                Schedule Booking
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => {
              const isServing = item.position === 1
              const isNext = item.position === 2

              return (
                <Card
                  key={item.id}
                  className={`bg-slate-900 border transition hover:border-slate-700 ${
                    isServing 
                      ? 'border-amber-500/30' 
                      : isNext 
                      ? 'border-blue-500/20' 
                      : 'border-slate-800'
                  } text-slate-100`}
                >
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      
                      {/* Position Badge */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        isServing 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : isNext 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}>
                        {item.position}
                      </div>

                      {/* Client Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-base">{item.clientName}</span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                            {item.timeSlot}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 capitalize">{item.serviceType}</p>
                      </div>

                    </div>

                    {/* Wait Time & Status Badges */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="hidden sm:block">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Est. Wait</span>
                        <p className={`text-xs font-bold ${isServing ? 'text-amber-500' : isNext ? 'text-blue-400' : 'text-slate-300'} mt-0.5`}>
                          {item.estimatedTime}
                        </p>
                      </div>

                      <div>
                        {isServing && (
                          <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
                            Now Serving
                          </span>
                        )}
                        {isNext && (
                          <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
                            Next Up
                          </span>
                        )}
                        {!isServing && !isNext && (
                          <span className="inline-block bg-slate-800 text-slate-400 border border-slate-700/60 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Informative Footer */}
        <div className="mt-10 p-5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-300 mb-1">Queue Policies</p>
          <p>
            Queue positions are based on your scheduled appointment time slot for the selected date. Standard appointments last approximately 25-30 minutes. Please check-in at the desk upon arrival. If you need to reschedule, contact receptionist or edit via your client booking details.
          </p>
        </div>

      </div>
    </div>
  )
}
