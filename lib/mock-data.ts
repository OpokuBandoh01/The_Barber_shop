export interface Booking {
  id: number
  name: string
  phone: string
  email?: string
  paymentReference?: string
  date: string
  time: string
  service: string // service ID
  status: 'Confirmed' | 'Completed' | 'Pending' | 'Cancelled'
  notes?: string
  createdAt: string
}

export interface Service {
  id: string
  name: string
  price: number
  description: string
}

export const defaultServices: Service[] = [
  { id: 'haircut', name: 'Classic Haircut', price: 25, description: 'Classic clipper or scissors cut with hot lather neck shave' },
  { id: 'fade', name: 'Premium Fade', price: 30, description: 'Skin fade, taper fade, or bald fade with precision line-up' },
  { id: 'beard-trim', name: 'Beard Trim', price: 15, description: 'Beard shaping, line-up, and conditioning oil treatment' },
  { id: 'hot-shave', name: 'Hot Towel Shave', price: 20, description: 'Traditional straight razor shave with essential oils and hot towels' },
  { id: 'lineup', name: 'Lineup', price: 10, description: 'Sharpening of the hairline, temples, and neck' },
  { id: 'combo', name: 'Full Combo', price: 50, description: 'Haircut, beard styling, lineup, and hot towel treatment' },
]

export const defaultTimeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
]

const clientNames = [
  'Liam Neeson', 'Noah Miller', 'Oliver Davis', 'Elijah Rodriguez', 'James Anderson',
  'William Thomas', 'Benjamin Taylor', 'Lucas Moore', 'Henry Jackson', 'Alexander Martin',
  'Mason Lee', 'Michael Perez', 'Ethan Thompson', 'Daniel Garcia', 'Jacob Martinez',
  'Logan Robinson', 'Jackson Clark', 'Levi Rodriguez', 'Sebastian Lewis', 'Mateo Lee',
  'Jack Walker', 'Owen Hall', 'Theodore Allen', 'Aiden Young', 'Samuel Hernandez',
  'Joseph King', 'John Wright', 'David Lopez', 'Wyatt Hill', 'Carter Scott'
]

const phoneNumbers = [
  '(555) 123-4567', '(555) 234-5678', '(555) 345-6789', '(555) 456-7890', '(555) 567-8901',
  '(555) 678-9012', '(555) 789-0123', '(555) 890-1234', '(555) 901-2345', '(555) 012-3456',
  '(555) 111-2222', '(555) 333-4444', '(555) 555-6666', '(555) 777-8888', '(555) 999-0000',
  '(555) 147-2583', '(555) 369-1470', '(555) 258-3691', '(555) 159-7530', '(555) 753-1590'
]

const sampleNotes = [
  'Needs skin fade on sides',
  'Keep the top long, clean beard line',
  'Wants a classic scissor cut, no clippers',
  'Beard line-up with straight razor, please',
  'Trim mustache and clean up neck',
  'Combo trim, first time visiting',
  'Prefers cold towel if available',
  'Wants to try a new pomade'
]

export function seedLocalStorage() {
  if (typeof window === 'undefined') return

  const isSeeded = localStorage.getItem('bookings_seeded_v2')
  if (isSeeded === 'true') return

  // Clear previous version seeds and mock data to guarantee clean slate
  localStorage.removeItem('bookings_seeded')
  localStorage.removeItem('bookings')
  localStorage.removeItem('admin_slots_config')

  // Seed default services
  localStorage.setItem('admin_services', JSON.stringify(defaultServices))

  // Seed default time slots
  localStorage.setItem('admin_time_slots', JSON.stringify(defaultTimeSlots))

  // Seed empty bookings
  localStorage.setItem('bookings', JSON.stringify([]))

  // Seed empty slots config
  localStorage.setItem('admin_slots_config', JSON.stringify({}))

  localStorage.setItem('bookings_seeded_v2', 'true')
}
