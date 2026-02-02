import crypto from 'crypto'

// Default encryption key for development (32 characters)
const DEFAULT_KEY = 'accountflow-dev-key-32-chars-long!'

const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_SECRET || DEFAULT_KEY

if (!process.env.AI_KEY_ENCRYPTION_SECRET) {
  console.warn('AI_KEY_ENCRYPTION_SECRET not set, using default development key. Please set a custom key in production!')
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Encrypt a string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (base64)
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('AI_KEY_ENCRYPTION_SECRET not configured')
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a string using AES-256-GCM
 * @param encryptedText - Encrypted string in format: iv:authTag:ciphertext (base64)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('AI_KEY_ENCRYPTION_SECRET not configured')
  }

  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivBase64, authTagBase64, ciphertext] = parts
  
  const iv = Buffer.from(ivBase64, 'base64')
  const authTag = Buffer.from(authTagBase64, 'base64')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Mask an API key for display (show only last 4 chars)
 * @param apiKey - API key to mask
 * @returns Masked API key
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***'
  }
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
}
