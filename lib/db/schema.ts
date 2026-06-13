import { pgTable, text, integer, serial, timestamp } from 'drizzle-orm/pg-core'

export const services = pgTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const timeSlots = pgTable('time_slots', {
  id: serial('id').primaryKey(),
  slot: text('slot').notNull().unique(),
})

export const slotsConfig = pgTable('slots_config', {
  date: text('date').primaryKey(),
  capacity: integer('capacity').notNull(),
})

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').default('customer@example.com').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  service: text('service').notNull().references(() => services.id, { onDelete: 'cascade' }),
  status: text('status').$type<'Confirmed' | 'Completed' | 'Pending' | 'Cancelled'>().default('Confirmed').notNull(),
  notes: text('notes'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

