import { db } from '../lib/db/db'
import { bookings, admins } from '../lib/db/schema'

async function main() {
  console.log('Preparing database for production live launch...')
  try {
    // 1. Delete all bookings
    console.log('Deleting all bookings...')
    await db.delete(bookings)

    // 2. Delete all admins (triggers setup mode on next visit)
    console.log('Deleting all admin accounts...')
    await db.delete(admins)

    console.log('\nSuccess! Database is now clean and ready for production.')
    console.log('When you visit /admin on the live site, you will be prompted to set up the new master admin account.');
    process.exit(0)
  } catch (error) {
    console.error('Failed to prepare database:', error)
    process.exit(1)
  }
}

main()
