# Feature Specification: 分析页面双栏布局重构

**Feature Branch**: `004-analyze-dual-pane-layout`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "把 analyze.vue 按双栏布局拆分成 ChatPane + StatePane. ChatPane完成现在的AI对话分析功能，StatePane用来显示当前场景中所涉及到会计科目，会计规则的数据，及AI所绘制的帐户间资金、信息流图。AI对话实时更新承载分析过程，但是StatePane只显示经过用户确认的当前场景的分析结果。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 实时AI对话分析 (Priority: P1)

作为财务分析人员，我希望在左侧ChatPane中与AI进行实时对话，描述业务场景并获得即时的会计分析反馈，以便快速理解业务场景的会计处理方式。

**Why this priority**: 这是核心功能，继承并增强现有的AI对话能力，是整个分析流程的入口和基础。

**Independent Test**: 可以通过发送业务场景描述消息、观察AI流式响应、查看分析建议来独立测试，无需StatePane即可验证对话功能完整性。

**Acceptance Scenarios**:

1. **Given** 用户打开场景分析页面, **When** 页面加载完成, **Then** 显示双栏布局，左侧ChatPane显示历史对话记录
2. **Given** ChatPane已显示, **When** 用户输入业务场景描述并发送, **Then** AI以流式方式实时响应，显示分析过程
3. **Given** AI正在响应中, **When** 响应包含mermaid流程图, **Then** 流程图在对话区域正确渲染显示

---

### User Story 2 - 确认分析结果到状态面板 (Priority: P1)

作为财务分析人员，我希望能够将AI分析出的会计科目、规则和流程图确认保存到右侧StatePane，以便形成当前场景的正式分析结论。

**Why this priority**: 这是区分"分析过程"与"分析结果"的关键功能，实现用户对分析结论的主动确认机制。

**Independent Test**: 可以通过在AI响应后点击确认按钮、观察StatePane更新来独立测试确认流程。

**Acceptance Scenarios**:

1. **Given** AI已完成一轮分析响应, **When** 响应中包含会计科目识别结果, **Then** 显示"确认"操作按钮
2. **Given** 用户点击确认按钮, **When** 确认操作完成, **Then** 会计科目、规则和流程图同步显示到右侧StatePane
3. **Given** StatePane已显示确认的内容, **When** 用户继续与AI对话产生新分析, **Then** StatePane内容保持不变，直到用户再次确认

---

### User Story 3 - 查看确认的会计科目和规则 (Priority: P2)

作为财务分析人员，我希望在右侧StatePane中清晰地查看当前场景已确认的会计科目清单和适用的会计规则，以便审核和存档。

**Why this priority**: 这是StatePane的主要内容展示功能，为用户提供结构化的分析结果视图。

**Independent Test**: 可以通过确认分析结果后检查StatePane中会计科目列表和规则说明的显示效果来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户已确认AI分析结果, **When** StatePane刷新显示, **Then** 会计科目以清单形式展示，包含科目编号、名称、借贷方向
2. **Given** 分析结果包含会计规则, **When** StatePane刷新显示, **Then** 会计规则以卡片或列表形式展示，说明适用条件

---

### User Story 4 - 查看资金信息流图 (Priority: P2)

作为财务分析人员，我希望在右侧StatePane中查看AI绘制的账户间资金流和信息流图，以便直观理解业务场景中的资金流动路径。

**Why this priority**: 可视化流程图帮助用户直观理解复杂的账户关系和资金流向。

**Independent Test**: 可以通过确认包含流程图的分析结果后检查StatePane中图表渲染效果来独立测试。

**Acceptance Scenarios**:

1. **Given** 用户已确认包含流程图的分析结果, **When** StatePane刷新显示, **Then** 资金/信息流图以可视化图表形式渲染
2. **Given** 流程图已显示, **When** 用户查看图表, **Then** 图表可缩放或滚动以查看完整内容

---

### User Story 5 - 清空或重置StatePane (Priority: P3)

作为财务分析人员，我希望能够清空StatePane中已确认的内容，以便重新开始分析或更正之前的确认。

**Why this priority**: 提供纠错和重置能力，增强用户操作的灵活性。

**Independent Test**: 可以通过确认内容后点击清空按钮、观察StatePane恢复空白状态来独立测试。

**Acceptance Scenarios**:

1. **Given** StatePane中有已确认的内容, **When** 用户点击清空/重置按钮, **Then** 系统请求确认
2. **Given** 用户确认清空操作, **When** 操作完成, **Then** StatePane恢复为空白初始状态

---

### Edge Cases

- 当AI响应中没有可识别的会计科目或规则时，如何处理确认操作？（显示提示信息，确认按钮不可用）
- 当用户在AI响应过程中点击确认按钮时如何处理？（等待响应完成后再启用确认按钮）
- 当StatePane内容过长时如何处理？（提供滚动区域）
- 当网络中断导致确认操作失败时如何处理？（显示错误提示，允许重试）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 将现有analyze.vue页面重构为左右双栏布局
- **FR-002**: 系统 MUST 在左侧ChatPane中保留现有的全部AI对话功能（发送消息、流式响应、消息历史、导出、分享等）
- **FR-003**: 系统 MUST 在右侧StatePane中显示已确认的分析结果
- **FR-004**: 系统 MUST 在AI响应完成后显示确认操作入口
- **FR-005**: 用户 MUST 能够将AI分析结果确认到StatePane
- **FR-006**: 系统 MUST 从AI响应中提取会计科目信息（科目编号、名称、借贷方向）
- **FR-007**: 系统 MUST 从AI响应中提取会计规则说明
- **FR-008**: 系统 MUST 从AI响应中提取mermaid格式的流程图
- **FR-009**: 系统 MUST 在StatePane中正确渲染会计科目列表
- **FR-010**: 系统 MUST 在StatePane中正确渲染会计规则卡片/列表
- **FR-011**: 系统 MUST 在StatePane中正确渲染资金/信息流图
- **FR-012**: 用户 MUST 能够清空/重置StatePane中的已确认内容
- **FR-013**: 系统 MUST 持久化StatePane中已确认的分析结果（与场景关联）
- **FR-014**: ChatPane与StatePane MUST 独立滚动，互不影响

### Key Entities

- **ChatPane（对话面板）**: 承载AI实时对话功能，显示用户输入和AI流式响应，包含消息历史、发送控件、Provider选择器
- **StatePane（状态面板）**: 显示用户确认后的分析结果，包含会计科目列表、会计规则说明、资金/信息流程图
- **ConfirmedAnalysis（已确认分析）**: 表示一次用户确认的分析结果，包含会计科目、规则、流程图数据，关联到场景
- **AccountingSubject（会计科目）**: 科目编号、科目名称、借贷方向（借/贷）
- **AccountingRule（会计规则）**: 规则描述、适用条件
- **FlowDiagram（流程图）**: mermaid格式的图表定义，用于展示资金/信息流

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户能够在3秒内完成从AI响应到确认分析结果的操作
- **SC-002**: StatePane能够正确渲染至少5个会计科目和3条会计规则
- **SC-003**: 流程图渲染成功率达到95%以上
- **SC-004**: 页面加载后双栏布局在1秒内完整呈现
- **SC-005**: 用户能够区分"分析过程"（ChatPane）和"分析结果"（StatePane）两个不同阶段
- **SC-006**: 90%的用户能够在首次使用时成功完成确认操作
- **SC-007**: StatePane中确认的内容在页面刷新后能够正确恢复显示

## Assumptions

- 现有AI响应中包含结构化的会计科目和规则信息（可通过特定格式标记提取）
- 现有mermaid流程图渲染逻辑可复用于StatePane
- 场景（Scenario）数据模型可扩展以存储已确认的分析结果
- 双栏布局在主流桌面浏览器和平板设备上可正常显示
- 确认操作会覆盖之前StatePane中的内容（非增量追加）
