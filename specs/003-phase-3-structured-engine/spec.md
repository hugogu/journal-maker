# Feature Specification: 结构化分析与交互引擎实现

**Feature Branch**: `003-phase-3-structured-engine`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "更新项目的 SpecKit 文档，以启动 Phase 3 开发阶段：结构化分析与交互引擎实现。实现 AI 对话内容的结构化提取，并构建 Chat-to-State 的实时交互闭环。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 双栏工作台UI重构 (Priority: P1)

用户在分析页面需要同时看到对话和实时状态。系统必须采用双栏布局：左侧为对话框，右侧为状态仪表板（包含流程图、规则预览、科目映射三个标签页）。

**Why this priority**: 这是新交互范式的基础。没有双栏布局，用户无法实时看到AI分析结果的结构化展示。

**Independent Test**: 可以独立测试：打开分析页面，页面呈现左右分栏布局，右侧包含Flow/Rules/Accounts三个标签页。

**Acceptance Scenarios**:

1. **Given** 用户打开场景分析页面，**When** 页面加载完成，**Then** 页面呈现左右双栏布局，左侧为对话框，右侧为状态仪表板
2. **Given** 用户在右侧状态仪表板，**When** 点击不同标签，**Then** 可以在Flow/Rules/Accounts之间切换
3. **Given** 用户调整浏览器窗口大小，**When** 窗口变小，**Then** 布局响应式调整，在移动端自动切换为上下布局

---

### User Story 2 - AI结构化提取与提案展示 (Priority: P1)

当用户在对话框输入业务描述后，AI必须使用Function Calling (Tools)输出结构化数据，系统将其作为"提案"在右侧展示，等待用户确认。

**Why this priority**: 这是核心功能，实现"Chat-to-State"闭环的关键。用户必须能看到AI提取的结构化规则。

**Independent Test**: 可以独立测试：用户输入"用户支付100元，其中1%是手续费"，右侧自动弹出规则提案卡片。

**Acceptance Scenarios**:

1. **Given** 用户在对话框输入业务描述，**When** AI返回tool_calls响应，**Then** 右侧Rules标签页自动激活并展示提案卡片
2. **Given** 右侧显示规则提案，**When** 用户查看提案内容，**Then** 可以看到结构化的借贷分录（借方科目、金额、贷方科目、金额）
3. **Given** 规则提案显示在右侧，**When** 用户编辑提案内容，**Then** 可以修改科目名称、金额、或添加/删除分录行
4. **Given** 用户查看规则提案，**When** 提案中引用了新科目，**Then** 新科目以高亮方式标注，并提示需要先创建科目

---

### User Story 3 - 实时流程图可视化 (Priority: P2)

当AI提取出资金流规则后，系统自动在Flow标签页中渲染Mermaid流程图，展示资金在不同主体间的流动。

**Why this priority**: 可视化帮助用户直观理解复杂的资金流动路径，是用户体验的增强功能。

**Independent Test**: 可以独立测试：当右侧Rules标签有数据时，切换到Flow标签可以看到Mermaid渲染的流程图。

**Acceptance Scenarios**:

1. **Given** 右侧Rules标签有规则提案，**When** 用户切换到Flow标签，**Then** 看到基于当前规则自动生成的Mermaid资金流图
2. **Given** Flow标签显示流程图，**When** 用户在Rules标签修改规则，**Then** Flow标签的流程图自动更新节点和连接
3. **Given** 用户查看Flow标签，**When** 流程图渲染失败（如Mermaid语法错误），**Then** 显示友好的错误提示和原始Mermaid代码

---

### User Story 4 - 提案确认与持久化 (Priority: P1)

用户在右侧确认AI提案后，系统调用后端API将结构化数据写入数据库（journal_rules表和flowchart_data表）。

**Why this priority**: 这是闭环的最后一步，确保用户确认的规则能够被保存和复用。

**Independent Test**: 可以独立测试：用户点击提案卡片的"确认"按钮，数据库journal_rules表新增记录。

**Acceptance Scenarios**:

1. **Given** 右侧显示规则提案，**When** 用户点击"确认并保存"按钮，**Then** 调用API将规则写入journal_rules表
2. **Given** 用户点击确认按钮，**When** API调用成功，**Then** 提案卡片状态变为"已保存"，并显示成功提示
3. **Given** 用户点击确认按钮，**When** API调用失败（如网络错误），**Then** 显示错误信息，提案卡片保持可编辑状态
4. **Given** 规则已保存到数据库，**When** 用户重新打开该场景，**Then** 右侧自动加载已保存的规则

---

### User Story 5 - Zod Schema与Tool Provider实现 (Priority: P1)

后端必须定义Zod Schema并将其转换为JSON Schema，配置OpenAI Tools，使AI能够输出结构化数据。

**Why this priority**: 这是后端基础设施，是所有结构化提取的前提条件。

**Independent Test**: 可以独立测试：调用Chat API时，OpenAI返回tool_calls而不是纯文本。

**Acceptance Scenarios**:

1. **Given** 后端定义了JournalRuleSchema，**When** 调用Chat API，**Then** OpenAI请求包含tools参数和JSON Schema
2. **Given** AI需要查询现有科目，**When** AI调用query_accounts工具，**Then** 后端返回当前所有active科目的结构化列表
3. **Given** AI需要提交规则草案，**When** AI调用propose_journal_rule工具，**Then** 后端验证Schema并透传给前端（不写库）
4. **Given** AI需要试算交易，**When** AI调用simulate_transaction工具，**Then** 后端基于当前规则生成示例交易数据

---

### Edge Cases

- **科目冲突**: 当AI提议的规则引用了不存在的科目时，系统如何处理？
  - 系统应在提案卡片中高亮标注未知科目，并提供"快速创建科目"按钮。
  
- **并发编辑**: 多个用户同时分析同一场景时，如何避免规则覆盖？
  - 在MVP阶段，采用"最后写入覆盖"策略，并在保存时显示警告。
  
- **AI无法理解场景**: 当用户输入的场景描述过于模糊时，如何引导？
  - AI应使用澄清式问题（通过对话），而不是直接返回tool_calls。

- **流程图过于复杂**: 当资金流涉及10+个主体时，Mermaid图可能难以阅读。
  - 在MVP阶段，仅渲染主要路径。未来可考虑分层展示或交互式图表。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统MUST采用双栏布局，左侧对话框，右侧状态仪表板（Flow/Rules/Accounts标签）
- **FR-002**: 系统MUST使用OpenAI Function Calling (Tools)进行结构化数据提取，禁止使用纯文本或Regex
- **FR-003**: 后端MUST使用Zod Schema定义JournalRuleSchema、AccountSchema、ScenarioContextSchema
- **FR-004**: 后端Chat API MUST配置tools参数，注册query_accounts、propose_journal_rule、simulate_transaction工具
- **FR-005**: 前端MUST接收tool_calls响应并在右侧作为"提案"展示，禁止AI直接修改数据库
- **FR-006**: 用户MUST能够在右侧编辑AI提案，点击"确认并保存"后才写入数据库
- **FR-007**: 系统MUST维护全局唯一的会计科目表，AI必须优先复用现有科目
- **FR-008**: 新增科目MUST通过显式的AccountProposal流程，不能静默创建
- **FR-009**: Flow标签页MUST实时渲染Mermaid资金流图，基于Rules标签的当前数据
- **FR-010**: 系统MUST在提案中高亮显示未知科目，并提供快速创建科目的入口

### Key Entities *(include if feature involves data)*

- **JournalRule**: 记账规则，包含借贷分录、触发条件、关联科目
  - 属性: id, scenario_id, rule_name, entries (借贷分录JSON), created_at, status
  
- **AccountProposal**: 科目提案，当AI提议新科目时创建
  - 属性: id, account_code, account_name, account_type, proposed_by_rule_id, status (pending/approved/rejected)
  
- **FlowchartData**: 流程图数据，存储Mermaid语法
  - 属性: id, scenario_id, mermaid_code, generated_from_rule_id, updated_at
  
- **ToolCallLog**: 工具调用日志，记录AI的工具调用历史
  - 属性: id, scenario_id, tool_name, arguments, result, timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户输入业务描述后，右侧在2秒内显示结构化规则提案（不考虑AI响应时间）
- **SC-002**: 提案确认后，数据成功写入数据库，成功率>99%
- **SC-003**: Flow标签的流程图渲染成功率>95%（排除用户手动编辑导致的语法错误）
- **SC-004**: 用户在双栏界面完成一次完整的"描述→提案→确认"流程，平均耗时<5分钟（含AI交互）
- **SC-005**: AI复用现有科目的比例>80%（即新场景中，80%的科目来自已有科目表）
- **SC-006**: 用户对结构化提案的满意度>4/5（通过用户反馈收集）
