# Implementation Plan: 结构化分析与交互引擎

**Branch**: `003-phase-3-structured-engine` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-phase-3-structured-engine/spec.md`

## Summary

实现AI对话内容的结构化提取，构建"Chat-to-State"实时交互闭环。核心技术路线：使用OpenAI Function Calling配合Zod Schema实现结构化数据转换，采用双栏工作台UI范式（左侧对话，右侧状态仪表板），所有AI输出先作为"提案"展示，经用户确认后才持久化到数据库。

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3  
**Primary Dependencies**: Nuxt 3, OpenAI SDK, Zod, Mermaid.js, TanStack Table  
**Storage**: PostgreSQL 15+ (已有 drizzle-orm)  
**Testing**: Vitest (如果需要)  
**Target Platform**: Web (Docker部署)  
**Project Type**: Web application (Nuxt monorepo)  
**Performance Goals**: 
- AI tool_calls响应后，前端渲染提案<2秒
- Mermaid流程图渲染<1秒
- 提案确认API响应<500ms

**Constraints**: 
- 禁止AI直接修改数据库确认状态
- 必须使用Zod Schema，禁止纯文本/Regex解析
- 必须维护全局唯一科目表，优先复用现有科目

**Scale/Scope**: 
- 单用户场景分析
- 支持10+个科目的复杂场景
- Mermaid流程图节点<20个

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Constitution Compliance

✅ **交互范式：双栏工作台** - 本feature的核心目标，完全符合
✅ **数据处理原则：结构化优先** - 使用OpenAI Function Calling + Zod Schema，完全符合
✅ **会计一致性约束** - 实现AccountProposal流程，优先复用现有科目，完全符合
✅ **Lightweight Architecture** - 不引入新的基础设施，复用现有Nuxt + PostgreSQL，符合
✅ **AI-Human Collaboration** - AI提供提案，用户确认后才持久化，完全符合
✅ **Component Reusability** - 新增的Vue组件（RuleProposalCard, LiveFlowchart）可复用，符合
✅ **Visualization-First Communication** - 实现Mermaid流程图可视化，符合

**结论**: 无Constitution违规项，可以继续Phase 0研究。

## Project Structure

### Documentation (this feature)

```text
specs/003-phase-3-structured-engine/
├── plan.md              # This file
├── spec.md              # Feature specification
├── tasks.md             # Implementation tasks (to be created)
├── research.md          # (optional) Research findings
└── contracts/           # (optional) API contracts
```

### Source Code (repository root)

```text
apps/accountflow/
├── src/
│   ├── components/
│   │   ├── proposals/
│   │   │   └── RuleProposalCard.vue      # NEW: 规则提案卡片组件
│   │   ├── visualizer/
│   │   │   └── LiveFlowchart.vue         # NEW: 实时Mermaid流程图组件
│   │   └── chat/                          # (已有) 对话组件
│   ├── pages/
│   │   └── scenarios/
│   │       └── [id]/
│   │           └── analyze.vue           # MODIFY: 改造为双栏布局
│   ├── server/
│   │   ├── api/
│   │   │   ├── chat.post.ts              # MODIFY: 配置OpenAI Tools
│   │   │   └── rules/
│   │   │       └── confirm.post.ts       # NEW: 确认并保存规则的API
│   │   └── utils/
│   │       └── schemas.ts                # NEW: Zod Schema定义
│   └── composables/
│       ├── useChatTools.ts               # NEW: 处理tool_calls的composable
│       └── useProposalState.ts           # NEW: 提案状态管理composable
└── drizzle/
    └── schema.ts                          # MODIFY: 添加journal_rules, flowchart_data表
```

**Structure Decision**: 
- 采用现有的Nuxt monorepo结构
- 新增components/proposals和components/visualizer目录，遵循组件分类规范
- 在server/api下新增rules子目录，遵循RESTful API路由规范
- 使用composables管理前端状态和工具调用逻辑，符合Vue 3最佳实践

## Implementation Phases

### Phase 0: Research & Design (Optional)

如果需要研究以下技术细节，可创建research.md：
- OpenAI Function Calling的最佳实践
- Zod Schema转JSON Schema的方案选择
- Mermaid.js在Vue中的集成方案
- 提案状态管理的架构（Pinia vs composables）

### Phase 1: Backend Infrastructure

**Goal**: 建立结构化提取的后端能力

**Tasks**:
1. 在`server/utils/schemas.ts`中定义Zod Schema（JournalRuleSchema, AccountSchema, ScenarioContextSchema）
2. 重构`server/api/chat.post.ts`，配置OpenAI tools参数
3. 实现动态System Prompt组装器，注入active accounts
4. 处理AI返回的tool_calls，透传给前端（不写库）
5. 创建`server/api/rules/confirm.post.ts`，实现规则确认API
6. 在drizzle schema中添加journal_rules和flowchart_data表

### Phase 2: Frontend Components

**Goal**: 构建双栏工作台UI和提案展示

**Tasks**:
1. 重构`pages/scenarios/[id]/analyze.vue`为双栏布局（使用CSS Grid）
2. 创建`components/proposals/RuleProposalCard.vue`，展示和编辑AI提案
3. 创建`components/visualizer/LiveFlowchart.vue`，渲染Mermaid流程图
4. 实现`composables/useChatTools.ts`，处理tool_calls数据
5. 实现`composables/useProposalState.ts`，管理提案状态（编辑、确认）
6. 在右侧Dashboard实现Flow/Rules/Accounts三个标签页

### Phase 3: Integration & Testing

**Goal**: 打通完整的Chat-to-State闭环

**Tasks**:
1. 集成Chat组件与Proposal组件，实现tool_calls数据流
2. 实现提案确认按钮，调用confirm API
3. 实现Mermaid流程图的自动更新逻辑
4. 处理边缘情况（未知科目高亮、错误处理）
5. 端到端测试：用户输入→AI提案→用户确认→数据库保存

## Key Technical Decisions

### 1. Zod Schema vs JSON Schema

**Decision**: 使用Zod定义Schema，运行时转换为JSON Schema
**Rationale**: 
- Zod提供TypeScript类型推导，减少类型不一致
- Zod的`.describe()`方法可以为字段添加说明，生成高质量的JSON Schema
- 社区有成熟的zod-to-json-schema库

### 2. Tool Calls透传 vs 后端直接执行

**Decision**: 后端透传tool_calls给前端，由前端决定是否执行
**Rationale**: 
- 符合"AI提案，人类确认"的Constitution原则
- 前端可以实时展示AI的意图（如propose_journal_rule的参数）
- 用户可以在确认前编辑提案

### 3. 提案状态管理：Pinia vs Composables

**Decision**: 使用Composables（useProposalState）
**Rationale**: 
- 提案状态仅在analyze页面使用，不需要全局状态管理
- Composables更轻量，符合Lightweight Architecture原则
- 易于单元测试

### 4. Mermaid渲染方案

**Decision**: 使用mermaid.js直接渲染，不依赖第三方Vue组件库
**Rationale**: 
- mermaid.js官方支持动态渲染
- 避免引入额外依赖（如vue-mermaid）
- 完全控制渲染逻辑和错误处理

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenAI API不稳定导致tool_calls失败 | High | 实现重试机制，并在UI上显示友好的错误提示 |
| Zod Schema与AI输出不匹配 | Medium | 在prompt中明确说明Schema约束，添加Schema验证错误处理 |
| Mermaid语法生成错误导致渲染失败 | Low | 在Flow标签页添加"显示原始代码"按钮，方便用户调试 |
| 前端状态同步复杂度增加 | Medium | 使用Composables封装状态逻辑，编写单元测试 |
| 用户编辑提案后，流程图未同步更新 | Low | 使用Vue的watch监听Rules数据变化，自动触发Mermaid重新渲染 |

## Dependencies

### External Dependencies (New)

- `zod`: Schema定义和验证
- `zod-to-json-schema`: Zod转JSON Schema
- `mermaid`: 流程图渲染（可能已有）

### Internal Dependencies

- 依赖现有的Chat API和对话组件
- 依赖现有的科目管理（Accounts表）
- 依赖现有的场景管理（Scenarios表）

## Success Metrics

- **开发效率**: 2周内完成核心功能开发（假设1名全职开发）
- **代码质量**: TypeScript strict mode，无any类型
- **用户体验**: 提案渲染<2秒，流程图渲染<1秒
- **稳定性**: 提案确认API成功率>99%

## Next Steps

1. 如需研究技术细节，运行`/speckit.research`生成research.md
2. 运行`/speckit.tasks`生成详细的tasks.md
3. 开始Phase 1后端开发
