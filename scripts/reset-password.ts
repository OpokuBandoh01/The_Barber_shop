import { db } from '../lib/db/db'
import { admins } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.log('\nUsage: npm run reset-admin <email> <new_password>\n')
    process.exit(1)
  }

  const [email, newPassword] = args
  const normalizedEmail = email.trim().toLowerCase()

  try {
    console.log(`Resetting password for admin: ${normalizedEmail}...`)
    
    const result = await db.update(admins)
      .set({ password: newPassword })
      .where(eq(admins.email, normalizedEmail))
      .returning()

    if (result.length === 0) {
      console.error(`\nError: Admin account with email "${normalizedEmail}" not found.\n`)
      process.exit(1)
    }

    console.log(`\nSuccess: Password for admin "${normalizedEmail}" has been reset successfully to "${newPassword}"!\n`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to reset password:', error)
    process.exit(1)
  }
}

main()
