import { db } from '../index'
import { scenarios } from '../schema'
import { eq } from 'drizzle-orm'

export async function getScenario(id: number) {
  return db.query.scenarios.findFirst({
    where: eq(scenarios.id, id),
  })
}
