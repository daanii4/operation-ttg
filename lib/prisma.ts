import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prismaTtg?: PrismaClient }

/** Same pooler tuning pattern as scholars-os when `DATABASE_URL` uses pgbouncer. */
function tunedDatabaseUrl(min: number): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return raw
  }
  if (url.searchParams.get('pgbouncer') !== 'true') return raw
  const current = Number(url.searchParams.get('connection_limit') ?? '0')
  if (current >= min) return raw
  url.searchParams.set('connection_limit', String(min))
  return url.toString()
}

function makePrisma(): PrismaClient {
  const url = tunedDatabaseUrl(10)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    ...(url ? { datasourceUrl: url } : {}),
  })
}

export const prismaTtg =
  globalForPrisma.prismaTtg ??
  makePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaTtg = prismaTtg
}
