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
        setSubmitted(true)
        setTimeout(() => {
          setSelectedDate(null)
          setFormData({ name: '', phone: '', email: '', time: '', service: '', notes: '' })
          setSubmitted(false)
        }, 2000)
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Book Your Appointment</h1>
          <p className="text-slate-400">Select a date to check availability, then fill in your details</p>
        </div>

        {!selectedDate ? (
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
                          className={`aspect-square rounded-lg font-semibold transition flex flex-col items-center justify-center p-2 text-sm ${
                            isPast
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
