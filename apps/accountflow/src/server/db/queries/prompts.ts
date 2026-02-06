import { db } from '../index'
import { promptTemplates, promptVersions, users } from '../schema'
import { eq, desc, asc, count } from 'drizzle-orm'
import type { PromptTemplate, PromptVersion, NewPromptTemplate, NewPromptVersion } from '../types'

// Get all prompt templates with their active version
export async function getPromptTemplates() {
  const templates = await db.query.promptTemplates.findMany({
    with: {
      activeVersion: {
        columns: {
          id: true,
          versionNumber: true,
          createdAt: true,
        },
      },
    },
    orderBy: asc(promptTemplates.scenarioType),
  })

  // Get version counts in a single query using SQL aggregation
  const versionCounts = await db
    .select({
      templateId: promptVersions.templateId,
      count: count(promptVersions.id),
    })
    .from(promptVersions)
    .groupBy(promptVersions.templateId)

  // Create a map for quick lookup
  const countMap = new Map(versionCounts.map((vc) => [vc.templateId, vc.count]))

  // Combine the data
  return templates.map((template) => ({
    ...template,
    versionCount: countMap.get(template.id) ?? 0,
  }))
}

// Get a single prompt template with full details and version history
export async function getPromptTemplate(id: number) {
  const template = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.id, id),
    with: {
      activeVersion: {
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!template) return null

  // Get all versions for this template
  const versions = await db.query.promptVersions.findMany({
    where: eq(promptVersions.templateId, id),
    orderBy: desc(promptVersions.versionNumber),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })

  return {
    ...template,
    versions: versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    })),
  }
}

// Get a specific version with full content
export async function getPromptVersion(id: number) {
  return db.query.promptVersions.findFirst({
    where: eq(promptVersions.id, id),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
        },
      },
      template: {
        columns: {
          id: true,
          scenarioType: true,
          name: true,
        },
      },
    },
  })
}

// Create a new prompt template
export async function createPromptTemplate(data: NewPromptTemplate) {
  const [template] = await db.insert(promptTemplates).values(data).returning()

  return template
}

// Create a new version for a template
export async function createPromptVersion(data: {
  templateId: number
  content: string
  variables?: unknown
  createdBy?: number | null
}) {
  // Get the next version number
  const existingVersions = await db.query.promptVersions.findMany({
    where: eq(promptVersions.templateId, data.templateId),
    orderBy: desc(promptVersions.versionNumber),
    limit: 1,
  })

  const versionNumber = existingVersions[0]?.versionNumber
    ? existingVersions[0].versionNumber + 1
    : 1

  const [version] = await db
    .insert(promptVersions)
    .values({
      ...data,
      versionNumber,
    })
    .returning()

  return version
}

// Activate a specific version
export async function activatePromptVersion(templateId: number, versionId: number) {
  const [updated] = await db
    .update(promptTemplates)
    .set({
      activeVersionId: versionId,
      updatedAt: new Date(),
    })
    .where(eq(promptTemplates.id, templateId))
    .returning()

  return updated
}

// Get the active version content for a scenario type
export async function getActivePromptContent(
  scenarioType:
    | 'scenario_analysis'
    | 'sample_generation'
    | 'prompt_generation'
    | 'flowchart_generation'
) {
  const template = await db.query.promptTemplates.findFirst({
    where: eq(promptTemplates.scenarioType, scenarioType),
    with: {
      activeVersion: {
        columns: {
          id: true,
          content: true,
        },
      },
    },
  })

  return template?.activeVersion?.content ?? null
}

// Extract variables from prompt content ({{variableName}} pattern)
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}
