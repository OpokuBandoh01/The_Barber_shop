'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Trash2, Plus, Edit2, Save, X, TrendingUp, Calendar, Clock, Scissors, 
  DollarSign, Users, CheckCircle, AlertTriangle, HelpCircle, UserPlus, LogOut
} from 'lucide-react'
import { 
  seedLocalStorage, defaultServices, defaultTimeSlots, type Booking, type Service 
} from '@/lib/mock-data'
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts'

export default function AdminDashboard() {
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
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [slotsConfig, setSlotsConfig] = useState<Record<string, number>>({})

  // Analytics tab state
  const [analyticsScope, setAnalyticsScope] = useState<'month' | 'day'>('month')

  // Form states for manual booking (Walk-in)
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    phone: '',
    email: '',
    time: '',
    service: '',
    notes: ''
  })
  const [walkinSuccess, setWalkinSuccess] = useState(false)

  // Settings states
  const [allocDate, setAllocDate] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
  const [allocCapacity, setAllocCapacity] = useState('10')
  const [newTimeSlot, setNewTimeSlot] = useState('')
  const [serviceForm, setServiceForm] = useState<Partial<Service> & { isEditing: boolean }>({
    id: '',
    name: '',
    price: 0,
    description: '',
    isEditing: false
  })
  const [newServiceError, setNewServiceError] = useState('')

  const router = useRouter()

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

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        alert('Failed to logout')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Update localStorage helper
  // Booking Actions
  const handleUpdateStatus = async (id: number, status: Booking['status']) => {
    try {
      const res = await fetch('/api/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
      } else {
        alert('Failed to update status')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteBooking = async (id: number) => {
    try {
      const res = await fetch('/api/bookings/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id))
      } else {
        alert('Failed to delete booking')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Walk-in booking submission
  const handleAddWalkin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (walkinForm.name && walkinForm.phone && walkinForm.time && walkinForm.service) {
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: walkinForm.name,
            phone: walkinForm.phone,
            email: walkinForm.email || 'walk-in@barbershop.com',
            date: selectedDate,
            time: walkinForm.time,
            service: walkinForm.service,
            notes: walkinForm.notes,
            paymentReference: 'walk-in',
          }),
        })
        if (res.ok) {
          const newBooking = await res.json()
          setBookings(prev => [...prev, newBooking])
          setWalkinSuccess(true)
          setWalkinForm({ name: '', phone: '', email: '', time: '', service: '', notes: '' })
          setTimeout(() => setWalkinSuccess(false), 3000)
        } else {
          const errData = await res.json()
          alert(errData.error || 'Failed to add walk-in booking')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Settings Actions: Slot Allocation
  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault()
    const cap = parseInt(allocCapacity, 10)
    if (allocDate && !isNaN(cap) && cap >= 0) {
      try {
        const res = await fetch('/api/slots-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: allocDate, capacity: cap }),
        })
        if (res.ok) {
          setSlotsConfig(prev => ({ ...prev, [allocDate]: cap }))
          alert(`Successfully set capacity for ${allocDate} to ${cap} slots.`)
        } else {
          alert('Failed to save capacity config')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Settings Actions: Time Slots
  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
      try {
        const res = await fetch('/api/time-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: newTimeSlot }),
        })
        if (res.ok) {
          const fetchSlots = await fetch('/api/time-slots')
          const slots = await fetchSlots.json()
          setTimeSlots(slots)
          setNewTimeSlot('')
        } else {
          alert('Failed to add time slot')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDeleteTimeSlot = async (slot: string) => {
    try {
      const res = await fetch('/api/time-slots/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      })
      if (res.ok) {
        setTimeSlots(prev => prev.filter(t => t !== slot))
      } else {
        alert('Failed to delete time slot')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Settings Actions: Services & Hairstyles
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceForm.name || serviceForm.price === undefined || serviceForm.price < 0) {
      setNewServiceError('Please enter a valid name and price.')
      return
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: serviceForm.id,
          name: serviceForm.name,
          price: serviceForm.price,
          description: serviceForm.description || '',
          isEditing: serviceForm.isEditing,
        }),
      })

      if (res.ok) {
        const savedService = await res.json()
        if (serviceForm.isEditing) {
          setServices(prev => prev.map(s => s.id === serviceForm.id ? savedService : s))
        } else {
          setServices(prev => [...prev, savedService])
        }
        setServiceForm({ id: '', name: '', price: 0, description: '', isEditing: false })
        setNewServiceError('')
      } else {
        const errData = await res.json()
        setNewServiceError(errData.error || 'Failed to save hairstyle configuration.')
      }
    } catch (err) {
      console.error(err)
      setNewServiceError('An error occurred. Please try again.')
    }
  }

  const handleDeleteService = async (id: string) => {
    if (confirm('Are you sure you want to delete this hairstyle option? Existing bookings for this hairstyle will remain but customers won\'t be able to book it anymore.')) {
      try {
        const res = await fetch('/api/services/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (res.ok) {
          setServices(prev => prev.filter(s => s.id !== id))
        } else {
          alert('Failed to delete hairstyle option.')
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Data helpers
  const getBookingPrice = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.price || 0
  }

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || serviceId
  }

  const getCapacityForDate = (dateStr: string) => {
    if (slotsConfig[dateStr] !== undefined) {
      return slotsConfig[dateStr]
    }
    const dayOfWeek = new Date(dateStr).getDay()
    return dayOfWeek === 0 ? 0 : 10 // Closed on Sunday, 10 slots otherwise
  }

  // Filtering for selected date bookings
  const dateBookings = bookings.filter(b => b.date === selectedDate)
  const totalCapacity = getCapacityForDate(selectedDate)
  const activeBookings = dateBookings.filter(b => b.status !== 'Cancelled')
  const usedSlots = activeBookings.length
  const availableSlots = Math.max(0, totalCapacity - usedSlots)
  const occupancyRate = Math.round((usedSlots / totalCapacity) * 100)

  // Status Styling
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
      case 'Confirmed':
        return 'bg-blue-950/40 text-blue-400 border border-blue-800'
      case 'Pending':
        return 'bg-amber-950/40 text-amber-400 border border-amber-800'
      case 'Cancelled':
        return 'bg-rose-950/40 text-rose-400 border border-rose-800'
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700'
    }
  }

  // --- ANALYTICS CALCULATIONS (FOR JUNE 2026 MOCK DATA) ---
  const juneBookings = bookings.filter(b => b.date.startsWith('2026-06'))
  const juneActiveBookings = juneBookings.filter(b => b.status !== 'Cancelled')
  const juneCompleted = juneBookings.filter(b => b.status === 'Completed')

  // Overall statistics
  const totalBookingsCount = analyticsScope === 'month' ? juneBookings.length : dateBookings.length
  const activeBookingsCount = analyticsScope === 'month' ? juneActiveBookings.length : activeBookings.length
  
  const revenue = (analyticsScope === 'month' ? juneBookings : dateBookings)
    .filter(b => b.status === 'Completed' || b.status === 'Confirmed')
    .reduce((sum, b) => sum + getBookingPrice(b.service), 0)

  const averageTicket = activeBookingsCount > 0 ? Math.round(revenue / activeBookingsCount) : 0

  // Month-wide occupancy calculation
  const totalDaysInJune = 30
  let totalAllocatedCapacity = 0
  let totalBookedSlots = 0
  for (let day = 1; day <= totalDaysInJune; day++) {
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`
    const cap = getCapacityForDate(dateStr)
    const booked = bookings.filter(b => b.date === dateStr && b.status !== 'Cancelled').length
    totalAllocatedCapacity += cap
    totalBookedSlots += booked
  }
  const averageOccupancy = totalAllocatedCapacity > 0 ? Math.round((totalBookedSlots / totalAllocatedCapacity) * 100) : 0
  const displayOccupancy = analyticsScope === 'month' ? averageOccupancy : occupancyRate

  // Recharts: Daily Revenue Chart data
  const chartDailyData = Array.from({ length: 25 }, (_, i) => {
    const day = i + 1
    const dateStr = `2026-06-${day.toString().padStart(2, '0')}`
    const dayBookings = bookings.filter(b => b.date === dateStr && b.status !== 'Cancelled')
    const dayRevenue = dayBookings
      .filter(b => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + getBookingPrice(b.service), 0)
    
    return {
      day: `June ${day}`,
      Revenue: dayRevenue,
      Bookings: dayBookings.length
    }
  })

  // Recharts: Service popularity data
  const chartServiceData = services.map(s => {
    const currentScopeBookings = analyticsScope === 'month' ? juneBookings : dateBookings
    const count = currentScopeBookings.filter(b => b.service === s.id && b.status !== 'Cancelled').length
    return {
      name: s.name,
      value: count,
      Revenue: count * s.price
    }
  }).filter(item => item.value > 0)

  // Recharts: Time slots distribution data
  const chartTimeData = timeSlots.map(slot => {
    const currentScopeBookings = analyticsScope === 'month' ? juneBookings : dateBookings
    const count = currentScopeBookings.filter(b => b.time === slot && b.status !== 'Cancelled').length
    return {
      time: slot,
      Bookings: count
    }
  })

  // Custom chart colors
  const COLORS = ['#d97706', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 text-xs font-semibold mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
              {p.name}: {p.name.includes('Revenue') ? `GH₵${p.value}` : p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-slate-400 mt-4 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Link href="/admin" className="hover:text-amber-500 transition cursor-pointer">
                The Barber Shop
              </Link>
              <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0 text-[10px] py-0">ADMIN</Badge>
            </h1>
            <p className="text-slate-400 text-xs hidden sm:block">Dynamic Control and Business Insights</p>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-rose-900/50 hover:bg-rose-950/20 text-rose-400 text-sm gap-1.5 px-2.5 sm:px-4 h-9 sm:h-10"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          
          {/* Tab Selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <TabsList className="bg-slate-800/80 border border-slate-700 p-1 flex flex-col sm:flex-row w-full sm:w-auto h-auto sm:h-10 gap-1 sm:gap-0">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white w-full sm:w-auto justify-start sm:justify-center py-2 sm:py-0">
                <TrendingUp className="w-4 h-4 mr-2" /> Overview & Analytics
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white w-full sm:w-auto justify-start sm:justify-center py-2 sm:py-0">
                <Calendar className="w-4 h-4 mr-2" /> Manage Bookings
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white w-full sm:w-auto justify-start sm:justify-center py-2 sm:py-0">
                <Scissors className="w-4 h-4 mr-2" /> Shop Settings
              </TabsTrigger>
            </TabsList>

            {/* Global Date Selector */}
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 bg-slate-800/60 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-300">Selected Date:</span>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white w-40 h-8 py-0 focus-visible:ring-amber-500"
              />
            </div>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6 outline-none">
            {/* Scope Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-200">Business Progress Dashboard</h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Analyzing {analyticsScope === 'month' ? 'Full Month (June 2026)' : `Selected Day (${selectedDate})`}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setAnalyticsScope('day')} 
                  variant={analyticsScope === 'day' ? 'default' : 'outline'}
                  className={`flex-1 sm:flex-none ${analyticsScope === 'day' ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-700 text-white'}`}
                  size="sm"
                >
                  Day View
                </Button>
                <Button 
                  onClick={() => setAnalyticsScope('month')} 
                  variant={analyticsScope === 'month' ? 'default' : 'outline'}
                  className={`flex-1 sm:flex-none ${analyticsScope === 'month' ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-700 text-white'}`}
                  size="sm"
                >
                  June Overview
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/80 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</p>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">GH₵{revenue}</h3>
                      <p className="text-slate-500 text-[10px] mt-1.5 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" /> Confirmed + Completed
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/80 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Bookings</p>
                      <h3 className="text-3xl font-extrabold text-blue-400 mt-2">{totalBookingsCount}</h3>
                      <p className="text-slate-500 text-[10px] mt-1.5 flex items-center">
                        <Users className="w-3.5 h-3.5 text-blue-500 mr-1" /> {activeBookingsCount} active, {totalBookingsCount - activeBookingsCount} cancelled
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/80 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Occupancy Rate</p>
                      <h3 className="text-3xl font-extrabold text-amber-500 mt-2">{displayOccupancy}%</h3>
                      <p className="text-slate-500 text-[10px] mt-1.5 flex items-center">
                        <Clock className="w-3.5 h-3.5 text-amber-500 mr-1" /> Booked vs slot capacity
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/80 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Ticket Size</p>
                      <h3 className="text-3xl font-extrabold text-indigo-400 mt-2">GH₵{averageTicket}</h3>
                      <p className="text-slate-500 text-[10px] mt-1.5 flex items-center">
                        <Scissors className="w-3.5 h-3.5 text-indigo-500 mr-1" /> Average revenue per client
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Scissors className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Revenue Progress (Span 2 columns if month view) */}
              <Card className={`bg-slate-800 border-slate-700 shadow-xl lg:col-span-2 ${analyticsScope !== 'month' && 'opacity-50 pointer-events-none'}`}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200">Daily Revenue Progression (June 2026)</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    {analyticsScope === 'month' ? 'Real-time sales tracking over the calendar month' : 'Only available in Month Overview'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Hairstyle/Service Popularity */}
              <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200">Hairstyle Popularity Breakdown</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Share of bookings by style option</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex flex-col justify-center">
                  {chartServiceData.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center">No bookings data to visualize.</p>
                  ) : (
                    <>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartServiceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartServiceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend list */}
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2 overflow-y-auto max-h-16 px-2">
                        {chartServiceData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1.5 truncate">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-slate-300 truncate">{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Peak Hours Distribution */}
              <Card className="bg-slate-800 border-slate-700 shadow-xl lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200">Peak Hour Load Analysis</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Total bookings clustered by time slots</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Bookings" fill="#d97706" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: MANAGE BOOKINGS */}
          <TabsContent value="bookings" className="grid grid-cols-1 lg:grid-cols-3 gap-6 outline-none">
            
            {/* Bookings List (Col Span 2) */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                  <div>
                    <CardTitle className="text-lg">Appointments for {selectedDate}</CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Daily Capacity: {totalCapacity} slots | Occupancy: {occupancyRate}%
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-700/80 text-slate-200 border-0">{activeBookings.length} Active</Badge>
                    <Badge className="bg-slate-700/50 text-slate-400 border-0">{dateBookings.length - activeBookings.length} Cancelled</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {dateBookings.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                      <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">No bookings scheduled for this date</p>
                      <p className="text-slate-500 text-xs mt-1">Select a new date, or add a walk-in booking on the right.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
                              {/* Time slot badge */}
                              <span className="bg-slate-800 text-amber-500 font-bold px-2.5 py-1 rounded text-center min-w-[75px] border border-slate-700">
                                {booking.time}
                              </span>
                              
                              {/* Mobile-only status badge */}
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold sm:hidden ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            
                            {/* Customer & Service Info */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-white font-bold text-sm sm:text-xs truncate">{booking.name}</span>
                                <span className="text-slate-500 hidden sm:inline">•</span>
                                <span className="text-slate-400 font-mono">{booking.phone}</span>
                                <span className="text-slate-500 hidden sm:inline">•</span>
                                <span className="text-slate-400 truncate break-all">{booking.email}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed">
                                <span className="text-amber-500 font-medium">{getServiceName(booking.service)}</span> (GH₵{getBookingPrice(booking.service)})
                                {booking.notes && <span className="text-slate-500"> — "{booking.notes}"</span>}
                                {booking.paymentReference && (
                                  <span className="text-indigo-400 font-mono block sm:inline sm:ml-2">
                                    [Ref: {booking.paymentReference}]
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            {/* Desktop-only status badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold hidden sm:inline shrink-0 ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-1.5 shrink-0 justify-end border-t border-slate-800/80 pt-2.5 md:pt-0 md:border-t-0 mt-1 md:mt-0">
                            {booking.status === 'Confirmed' && (
                              <>
                                <Button
                                  onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-3 text-[10px]"
                                >
                                  Complete
                                </Button>
                                <Button
                                  onClick={() => handleUpdateStatus(booking.id, 'Cancelled')}
                                  size="sm"
                                  variant="outline"
                                  className="border-rose-900 hover:bg-rose-950/40 text-rose-400 font-bold h-7 px-3 text-[10px]"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            <Button
                              onClick={() => handleDeleteBooking(booking.id)}
                              variant="ghost"
                              className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-1.5 h-7 w-7"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Walk-in Booking Form */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800 border-slate-700 shadow-xl sticky top-24">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" /> Book a Walk-in Client
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Direct scheduling on behalf of a customer for {selectedDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {walkinSuccess && (
                    <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-semibold">
                      ✓ Walk-in booking confirmed successfully!
                    </div>
                  )}
                  
                  <form onSubmit={handleAddWalkin} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-medium">Customer Name</label>
                      <Input
                        required
                        value={walkinForm.name}
                        onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-medium">Phone Number</label>
                      <Input
                        required
                        value={walkinForm.phone}
                        onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-medium">Email Address (Optional)</label>
                      <Input
                        type="email"
                        value={walkinForm.email}
                        onChange={(e) => setWalkinForm({ ...walkinForm, email: e.target.value })}
                        placeholder="customer@example.com"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">Time Slot</label>
                        <select
                          required
                          value={walkinForm.time}
                          onChange={(e) => setWalkinForm({ ...walkinForm, time: e.target.value })}
                          className="w-full h-9 px-2.5 bg-slate-700 border border-slate-600 text-white text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">Time</option>
                          {timeSlots.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">Hairstyle / Service</label>
                        <select
                          required
                          value={walkinForm.service}
                          onChange={(e) => setWalkinForm({ ...walkinForm, service: e.target.value })}
                          className="w-full h-9 px-2.5 bg-slate-700 border border-slate-600 text-white text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="">Service</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} (GH₵{s.price})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1.5 font-medium">Haircut Style Notes (Optional)</label>
                      <Input
                        value={walkinForm.notes}
                        onChange={(e) => setWalkinForm({ ...walkinForm, notes: e.target.value })}
                        placeholder="e.g. taper fade, keep top long"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={availableSlots === 0}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs"
                    >
                      {availableSlots === 0 ? 'Capacity Full for Day' : 'Add Walk-in Appointment'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: SHOP SETTINGS */}
          <TabsContent value="settings" className="grid grid-cols-1 lg:grid-cols-3 gap-6 outline-none">
            
            {/* Left Col: Slot capacity and Time slots */}
            <div className="lg:col-span-1 space-y-6">
              {/* Capacity Config */}
              <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" /> Set Slots Capacity per Date
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Allocate the total available booking slots for a selected date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveCapacity} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1.5">Date</label>
                        <Input
                          type="date"
                          required
                          value={allocDate}
                          onChange={(e) => setAllocDate(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1.5">Slots Capacity</label>
                        <Input
                          type="number"
                          min="0"
                          max="40"
                          required
                          value={allocCapacity}
                          onChange={(e) => setAllocCapacity(e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white h-9"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9">
                      Apply Capacity Allocation
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Time Slots Config */}
              <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Preferred Time Slots
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Manage the available booking hours for customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* List times */}
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-700 bg-slate-900/30 rounded-lg">
                    {timeSlots.map(t => (
                      <Badge key={t} className="bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 py-1 text-xs">
                        {t}
                        <X 
                          className="w-3 h-3 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0" 
                          onClick={() => handleDeleteTimeSlot(t)}
                        />
                      </Badge>
                    ))}
                  </div>

                  {/* Add time slot */}
                  <form onSubmit={handleAddTimeSlot} className="flex gap-2">
                    <Input
                      placeholder="e.g. 5:00 PM"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 text-white h-9 text-xs flex-1"
                    />
                    <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
                      Add Slot
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Services / Hairstyles Manager (Col Span 2) */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-amber-500" /> Hairstyles & Services Manager
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Create, edit, or remove client hairstyle selections and pricing models
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Service lists */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {services.map(s => (
                      <div key={s.id} className="p-3.5 rounded-lg border border-slate-700 bg-slate-900/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-200 text-sm">{s.name}</h4>
                            <span className="text-emerald-400 font-bold text-xs">GH₵{s.price}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-slate-400 hover:text-amber-500 hover:bg-amber-950/20"
                              onClick={() => setServiceForm({ ...s, isEditing: true })}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                              onClick={() => handleDeleteService(s.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add/Edit Form */}
                  <div className="border border-slate-700 p-4 rounded-lg bg-slate-900/20">
                    <h4 className="font-bold text-slate-200 text-sm mb-4 flex items-center justify-between">
                      {serviceForm.isEditing ? 'Modify Hairstyle Option' : 'Create New Hairstyle'}
                      {serviceForm.isEditing && (
                        <Button
                          variant="ghost"
                          className="h-6 px-1.5 text-xs text-rose-400"
                          onClick={() => setServiceForm({ id: '', name: '', price: 0, description: '', isEditing: false })}
                        >
                          Cancel
                        </Button>
                      )}
                    </h4>

                    {newServiceError && (
                      <div className="mb-4 p-2 bg-rose-950/40 border border-rose-800 text-rose-400 rounded text-xs">
                        {newServiceError}
                      </div>
                    )}

                    <form onSubmit={handleSaveService} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-300 block mb-1">Hairstyle Name</label>
                        <Input
                          required
                          value={serviceForm.name || ''}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          placeholder="e.g. Skin Fade"
                          className="bg-slate-700 border-slate-600 text-white h-9 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 block mb-1">Pricing (GH₵ GHS)</label>
                        <Input
                          type="number"
                          required
                          min="0"
                          value={serviceForm.price || ''}
                          onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                          placeholder="e.g. 30"
                          className="bg-slate-700 border-slate-600 text-white h-9 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 block mb-1">Description</label>
                        <textarea
                          value={serviceForm.description || ''}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          placeholder="Brief explanation of the cut/service..."
                          className="w-full p-2 bg-slate-700 border border-slate-600 text-white text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                          rows={4}
                        />
                      </div>

                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-9">
                        {serviceForm.isEditing ? 'Save Hairstyle Configuration' : 'Deploy Hairstyle Option'}
                      </Button>
                    </form>
                  </div>

                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
