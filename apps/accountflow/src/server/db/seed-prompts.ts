import { db } from './index'
import { promptTemplates, promptVersions } from './schema'

const defaultScenarioAnalysisPrompt = `# 角色设定
你是一位资深会计专家，精通中国会计准则和国际财务报告准则。

## 当前业务场景

{{companyContext}}

**场景名称**: {{scenarioName}}

**场景描述**: {{scenarioDescription}}

## 可用会计科目

{{accountsList}}

## 分析任务

请按以下步骤进行分析：

### 1. 业务场景理解
- 识别主要参与方
- 理解业务流程
- 分析关键交易环节

### 2. 关键事件识别
列出场景中的关键业务事件，并解释每个事件的会计含义。

### 3. 会计科目选择
为每个事件选择合适的会计科目，说明选择理由。

### 4. 业务流程图 (Mermaid)
使用 mermaid 语法绘制业务流程图：

\`\`\`mermaid
flowchart TD
    Start([开始]) --> Event1[事件1描述]
    Event1 --> Event2[事件2描述]
    Event2 --> End([结束])
\`\`\`

### 5. 会计分录
为每个关键事件编制会计分录。

### 6. 完整记账凭证
以表格形式展示完整的记账凭证信息。

请确保输出格式清晰、专业。`

export async function seedDefaultPrompts() {
  console.log('Seeding default prompt templates...')

  // Check if scenario analysis template already exists
  const existing = await db.query.promptTemplates.findFirst({
    where: (templates, { eq }) => eq(templates.scenarioType, 'scenario_analysis'),
  })

  if (existing) {
    console.log('Scenario analysis prompt template already exists, skipping...')
    return
  }

  // Create template
  const [template] = await db
    .insert(promptTemplates)
    .values({
      name: '场景分析助手',
      description: '用于分析业务场景并生成会计分录的AI助手',
      scenarioType: 'scenario_analysis',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  // Create first version
  const [version] = await db
    .insert(promptVersions)
    .values({
      templateId: template.id,
      versionNumber: 1,
      content: defaultScenarioAnalysisPrompt,
      createdBy: 1, // Admin user
      createdAt: new Date(),
    })
    .returning()

  // Activate the version
  await db
    .update(promptTemplates)
    .set({ activeVersionId: version.id })
    .where(eq(promptTemplates.id, template.id))

  console.log('Default prompt template seeded successfully!')
}

// Helper import for the update
import { eq } from 'drizzle-orm'
