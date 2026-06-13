import { randomBytes, pbkdf2Sync } from 'crypto'

/**
 * Hashes a plain-text password using SHA-512 PBKDF2 algorithm.
 * Returns a string formatted as "salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifies a plain-text password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':')
  if (parts.length !== 2) return false
  const [salt, hash] = parts
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}
