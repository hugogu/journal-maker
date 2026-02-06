// Database types for TypeScript inference
// Generated from schema.ts

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  companyProfile,
  users,
  accounts,
  scenarios,
  journalRules,
  sampleTransactions,
  // AI Management
  promptTemplates,
  promptVersions,
  aiProviders,
  aiModels,
  userPreferences,
  // Conversation & Analysis
  conversationMessages,
  conversationShares,
  analysisSubjects,
  analysisEntries,
  analysisDiagrams,
} from './schema'

// Existing types
export type Company = InferSelectModel<typeof companyProfile>
export type NewCompany = InferInsertModel<typeof companyProfile>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Account = InferSelectModel<typeof accounts>
export type NewAccount = InferInsertModel<typeof accounts>

export type Scenario = InferSelectModel<typeof scenarios>
export type NewScenario = InferInsertModel<typeof scenarios>

export type JournalRule = InferSelectModel<typeof journalRules>
export type NewJournalRule = InferInsertModel<typeof journalRules>

export type SampleTransaction = InferSelectModel<typeof sampleTransactions>
export type NewSampleTransaction = InferInsertModel<typeof sampleTransactions>

// AI Management types
export type PromptTemplate = InferSelectModel<typeof promptTemplates>
export type NewPromptTemplate = InferInsertModel<typeof promptTemplates>

export type PromptVersion = InferSelectModel<typeof promptVersions>
export type NewPromptVersion = InferInsertModel<typeof promptVersions>

export type AIProvider = InferSelectModel<typeof aiProviders>
export type NewAIProvider = InferInsertModel<typeof aiProviders>

export type AIModel = InferSelectModel<typeof aiModels>
export type NewAIModel = InferInsertModel<typeof aiModels>

export type CompanyProfile = InferSelectModel<typeof companyProfile>
export type NewCompanyProfile = InferInsertModel<typeof companyProfile>

export type ConversationMessage = InferSelectModel<typeof conversationMessages>
export type NewConversationMessage = InferInsertModel<typeof conversationMessages>

export type AnalysisSubject = InferSelectModel<typeof analysisSubjects>
export type NewAnalysisSubject = InferInsertModel<typeof analysisSubjects>

export type AnalysisEntry = InferSelectModel<typeof analysisEntries>
export type NewAnalysisEntry = InferInsertModel<typeof analysisEntries>

export type AnalysisDiagram = InferSelectModel<typeof analysisDiagrams>
export type NewAnalysisDiagram = InferInsertModel<typeof analysisDiagrams>

export type ConversationShare = InferSelectModel<typeof conversationShares>
export type NewConversationShare = InferInsertModel<typeof conversationShares>

export type UserPreference = InferSelectModel<typeof userPreferences>
export type NewUserPreference = InferInsertModel<typeof userPreferences>

// Request Log structure
export interface RequestLog {
  systemPrompt: string
  contextMessages: Array<{ role: string; content: string }>
  fullPrompt: string
  variables: Record<string, string>
}

// Response Stats structure
export interface ResponseStats {
  model: string
  providerId: string
  providerName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  durationMs: number
}

// AI Provider capabilities
export interface ModelCapabilities {
  contextLength?: number
  supportsStreaming?: boolean
  supportsFunctions?: boolean
}
