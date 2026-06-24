'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { seedLocalStorage, defaultServices, defaultTimeSlots, type Booking, type Service } from '@/lib/mock-data'

export default function BookingsPage() {
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    time: '',
    service: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  // Local storage states
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [slotsConfig, setSlotsConfig] = useState<Record<string, number>>({})

  const fetchData = async () => {
    try {
      const [bookingsRes, servicesRes, slotsRes, configRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/services'),
        fetch('/api/time-slots'),
        fetch('/api/slots-config')
      ])

      if (bookingsRes.ok && servicesRes.ok && slotsRes.ok && configRes.ok) {
        const bookingsData = await bookingsRes.json()
        const servicesData = await servicesRes.json()
        const slotsData = await slotsRes.json()
        const configData = await configRes.json()

        if (Array.isArray(bookingsData)) {
          setBookings(bookingsData)
        }
        if (Array.isArray(servicesData) && servicesData.length > 0) {
          setServices(servicesData)
        }
        if (Array.isArray(slotsData) && slotsData.length > 0) {
          setTimeSlots(slotsData)
        }
        if (configData && typeof configData === 'object') {
          setSlotsConfig(configData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data from API:', error)
    }
  }

  useEffect(() => {
    fetchData()
    setMounted(true)

    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])


  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getDateString = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const handleDateSelect = (day: number) => {
    const dateStr = getDateString(day)
    setSelectedDate(dateStr)
    setFormData({ name: '', phone: '', email: '', time: '', service: '', notes: '' })
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (formData.name && formData.phone && formData.email && formData.time && formData.service && selectedDate) {
      const selectedService = services.find(s => s.id === formData.service)
      const price = selectedService ? selectedService.price : 0

      if (!(window as any).PaystackPop) {
        alert('Payment gateway is loading, please try again in a moment.')
        return
      }

      try {
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: formData.email,
          amount: price * 100, // converted to smallest currency unit (pesewas)
          currency: 'GHS',
          ref: `bk_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          onSuccess: (transaction: any) => {
            handleSaveBooking(transaction.reference)
          },
          onCancel: () => {
            alert('Payment checkout window closed.')
          }
        })
      } catch (error) {
        console.error('Error initializing Paystack:', error)
        alert('Failed to initialize payment gateway')
      }
    }
  }

  const handleSaveBooking = async (paymentReference: string) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          date: selectedDate,
          time: formData.time,
          service: formData.service,
          notes: formData.notes,
          paymentReference,
        }),
      })

      if (res.ok) {
        const newBooking = await res.json()
        setBookings(prev => [...prev, newBooking])
        setConfirmedBooking(newBooking)
      } else {
        const errData = await res.json()
        alert(errData.error || 'Failed to submit booking')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleBackToCalendar = () => {
    setSelectedDate(null)
  }

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const calendarDays = []

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get time slots that are already booked for the selected date
  const bookedTimes = selectedDate
    ? bookings
      .filter(b => b.date === selectedDate && b.status !== 'Cancelled')
      .map(b => b.time)
    : []

  const availableTimeSlots = timeSlots.filter(slot => !bookedTimes.includes(slot))

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Loading booking platform...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white cursor-pointer hover:text-amber-500 transition">
              The Barber Shop
            </h1>
          </Link>
          <div className="flex gap-2.5 items-center">
            <ThemeToggle />
            <Link href="/queue" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-4 py-2 border border-slate-600 text-white hover:bg-slate-700 transition-colors">
              View Queue
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!confirmedBooking && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Book Your Appointment</h1>
            <p className="text-slate-400">Select a date to check availability, then fill in your details</p>
          </div>
        )}

        {confirmedBooking ? (
          // Ticket View
          <div className="max-w-md mx-auto my-4">
            <style dangerouslySetInnerHTML={{
              __html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #booking-ticket-card, #booking-ticket-card * {
                  visibility: visible;
                }
                #booking-ticket-card {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  box-shadow: none;
                  border: none;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-pulse">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
              <p className="text-slate-400 text-sm">
                Your appointment is locked in. Please screenshot or print this ticket for check-in.
              </p>
            </div>

            {/* Ticket Card */}
            <div
              id="booking-ticket-card"
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative text-slate-100"
            >
              {/* Top notch styling */}
              <div className="bg-amber-600 h-2 w-full" />

              {/* Main Ticket Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-700/60 pb-4 mb-4">
                  <div>
                    <h3 className="text-amber-500 font-extrabold text-lg tracking-wider">THE BARBER SHOP</h3>
                    <p className="text-xs text-slate-400 font-medium">APPOINTMENT TICKET</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      PAID
                    </span>
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="space-y-4 font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer Name</span>
                    <p className="text-base font-bold text-white mt-0.5">{confirmedBooking.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Phone</span>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{confirmedBooking.phone}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email</span>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{confirmedBooking.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-700/40 pt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Service Selected</span>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <p className="text-base font-bold text-white">
                        {services.find(s => s.id === confirmedBooking.service)?.name || confirmedBooking.service}
                      </p>
                      <p className="text-amber-500 font-bold text-base">
                        GH₵ {services.find(s => s.id === confirmedBooking.service)?.price || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dotted Tear Line with side punch holes */}
                <div className="relative border-t border-dashed border-slate-600/70 my-6">
                  {/* Left hole */}
                  <div className="absolute -left-8 -top-2 w-4 h-4 bg-slate-900 rounded-full border border-slate-700/50" />
                  {/* Right hole */}
                  <div className="absolute -right-8 -top-2 w-4 h-4 bg-slate-900 rounded-full border border-slate-700/50" />
                </div>

                {/* Bottom Ticket details */}
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Appointment Date</span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {new Date(confirmedBooking.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Time Slot</span>
                      <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {confirmedBooking.time}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ticket ID</span>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">#BK-{confirmedBooking.id}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Payment Ref</span>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 truncate" title={confirmedBooking.paymentReference}>
                        {confirmedBooking.paymentReference || 'walk-in'}
                      </p>
                    </div>
                  </div>

                  {confirmedBooking.notes && (
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/30 text-xs">
                      <span className="font-semibold text-slate-400 block mb-0.5">Notes:</span>
                      <span className="text-slate-300 italic">"{confirmedBooking.notes}"</span>
                    </div>
                  )}

                  {/* Barcode SVG */}
                  <div className="pt-2 text-center">
                    <svg className="w-full h-12 text-slate-400 mx-auto opacity-75 mt-2" viewBox="0 0 100 20" fill="currentColor">
                      <rect x="0" y="0" width="1" height="20" />
                      <rect x="2" y="0" width="2" height="20" />
                      <rect x="5" y="0" width="1" height="20" />
                      <rect x="7" y="0" width="3" height="20" />
                      <rect x="11" y="0" width="1" height="20" />
                      <rect x="13" y="0" width="1" height="20" />
                      <rect x="15" y="0" width="2" height="20" />
                      <rect x="18" y="0" width="4" height="20" />
                      <rect x="23" y="0" width="1" height="20" />
                      <rect x="25" y="0" width="2" height="20" />
                      <rect x="28" y="0" width="1" height="20" />
                      <rect x="30" y="0" width="3" height="20" />
                      <rect x="34" y="0" width="1" height="20" />
                      <rect x="36" y="0" width="2" height="20" />
                      <rect x="39" y="0" width="4" height="20" />
                      <rect x="44" y="0" width="1" height="20" />
                      <rect x="46" y="0" width="1" height="20" />
                      <rect x="48" y="0" width="2" height="20" />
                      <rect x="51" y="0" width="3" height="20" />
                      <rect x="55" y="0" width="1" height="20" />
                      <rect x="57" y="0" width="2" height="20" />
                      <rect x="60" y="0" width="4" height="20" />
                      <rect x="65" y="0" width="1" height="20" />
                      <rect x="67" y="0" width="1" height="20" />
                      <rect x="69" y="0" width="3" height="20" />
                      <rect x="73" y="0" width="2" height="20" />
                      <rect x="76" y="0" width="1" height="20" />
                      <rect x="78" y="0" width="4" height="20" />
                      <rect x="83" y="0" width="1" height="20" />
                      <rect x="85" y="0" width="2" height="20" />
                      <rect x="88" y="0" width="1" height="20" />
                      <rect x="90" y="0" width="3" height="20" />
                      <rect x="94" y="0" width="2" height="20" />
                      <rect x="97" y="0" width="1" height="20" />
                      <rect x="99" y="0" width="1" height="20" />
                    </svg>
                    <span className="text-[9px] font-mono text-slate-500 tracking-[0.25em] block mt-1.5">
                      *BK-{confirmedBooking.id}-{confirmedBooking.date.replace(/-/g, '')}*
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6 no-print font-sans">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 border-slate-600 text-white hover:bg-slate-700 h-11 text-sm font-semibold"
              >
                <svg className="w-4 h-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
                </svg>
                Download Ticket
              </Button>
              <Button
                onClick={() => {
                  setConfirmedBooking(null)
                  setSelectedDate(null)
                  setFormData({ name: '', phone: '', email: '', time: '', service: '', notes: '' })
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11 text-sm font-semibold"
              >
                Book Another
              </Button>
            </div>
          </div>
        ) : !selectedDate ? (
          // Calendar View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={previousMonth}
                        variant="outline"
                        size="icon"
                        className="border-slate-600 text-amber-500 hover:bg-slate-700"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        onClick={nextMonth}
                        variant="outline"
                        size="icon"
                        className="border-slate-600 text-amber-500 hover:bg-slate-700"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {dayNames.map(day => (
                      <div key={day} className="text-center font-semibold text-amber-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }

                      const dateStr = getDateString(day)
                      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const isSunday = dateObj.getDay() === 0
                      const defaultCapacity = isSunday ? 0 : 10
                      const capacity = slotsConfig[dateStr] ?? defaultCapacity
                      const bookedCount = bookings.filter((b) => b.date === dateStr && b.status !== 'Cancelled').length
                      const slots = Math.max(0, capacity - bookedCount)

                      const isToday = new Date().toDateString() === dateObj.toDateString()
                      const todayMidnight = new Date()
                      todayMidnight.setHours(0, 0, 0, 0)
                      const isPast = dateObj < todayMidnight

                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && capacity > 0 && slots > 0 && handleDateSelect(day)}
                          disabled={isPast || capacity === 0 || slots === 0}
                          className={`aspect-square rounded-lg font-semibold transition flex flex-col items-center justify-center p-2 text-sm ${isPast
                              ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed'
                              : capacity === 0
                                ? 'bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                                : slots === 0
                                  ? 'bg-red-900/40 text-red-300 border border-red-600 hover:bg-red-900/60'
                                  : 'bg-amber-600 text-white hover:bg-amber-700 border-2 border-amber-500'
                            }`}
                        >
                          <div className="text-base">{day}</div>
                          <div className={`hidden sm:block text-xs ${isPast ? 'text-slate-600' : capacity === 0 ? 'text-slate-500' : slots === 0 ? 'text-red-300' : 'text-amber-100'}`}>
                            {capacity === 0 ? 'Closed' : slots === 0 ? 'Full' : `${slots} slot${slots !== 1 ? 's' : ''}`}
                          </div>
                          <div className={`sm:hidden text-[9px] leading-none mt-0.5 font-bold ${isPast ? 'text-slate-600' : capacity === 0 ? 'text-slate-500' : slots === 0 ? 'text-red-300' : 'text-amber-100'}`}>
                            {capacity === 0 ? '✕' : slots === 0 ? '•' : `${slots}s`}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-8 pt-6 border-t border-slate-700 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-600" />
                      <span className="text-slate-300 text-sm">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-900/40 border border-red-600" />
                      <span className="text-slate-300 text-sm">Full</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-800/40 border border-slate-700/50" />
                      <span className="text-slate-300 text-sm">Closed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-700/30" />
                      <span className="text-slate-300 text-sm">Past</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info card */}
            <div className="lg:col-span-1">
              <Card className="bg-amber-900/20 border-amber-700 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-amber-400">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-300 text-sm">
                  <div>
                    <p className="font-semibold text-amber-400 mb-1">1. Pick a Date</p>
                    <p>Select any available date from the calendar above.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-400 mb-1">2. Fill Details</p>
                    <p>Enter your information and service preference.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-400 mb-1">3. Confirm</p>
                    <p>Review and confirm your booking.</p>
                  </div>
                  <div className="pt-2 border-t border-amber-700">
                    <p className="text-xs text-slate-400">Green dates show available slots. Red means fully booked.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Form View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Complete Your Booking</CardTitle>
                  <p className="text-slate-400 text-sm mt-2">
                    Selected Date: <span className="text-amber-400 font-semibold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                </CardHeader>

                <CardContent>
                  {submitted && (
                    <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                      <p className="text-green-400">✓ Booking submitted! (Mockup - no backend)</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-slate-300 block mb-3">Your Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 py-2.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-slate-300 block mb-3">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          required
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 py-2.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-slate-300 block mb-3">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                          required
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 py-2.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="time" className="text-slate-300 block mb-3">Preferred Time</Label>
                        <select
                          id="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">Select a time</option>
                          {availableTimeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="service" className="text-slate-300 block mb-3">Service Type</Label>
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">Select a service</option>
                          {services.map(service => (
                            <option key={service.id} value={service.id}>{service.name} - GH₵{service.price}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-slate-300 block mb-3">Haircut Style (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Describe your preferred haircut style (e.g., fade, undercut, length preference)..."
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleBackToCalendar}
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        Back to Calendar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-11 text-base font-semibold"
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Summary card */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800 border-slate-700 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-amber-400">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-300">
                  <div className="flex justify-between items-start">
                    <span>Date:</span>
                    <span className="font-semibold text-white">{new Date(selectedDate).toLocaleDateString()}</span>
                  </div>
                  {formData.time && (
                    <div className="flex justify-between items-start">
                      <span>Time:</span>
                      <span className="font-semibold text-white">{formData.time}</span>
                    </div>
                  )}
                  {formData.service && (
                    <div className="flex justify-between items-start">
                      <span>Service:</span>
                      <span className="font-semibold text-white">
                        {(() => {
                          const s = services.find(s => s.id === formData.service)
                          return s ? `${s.name} - GH₵{s.price}` : ''
                        })()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />
    </div>
  )
}
