# Feature Specification: Prompt版本化管理与AI服务增强

**Feature Branch**: `002-prompt-ai-management`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Prompt版本化管理、多AI Provider支持、公司信息维护、会话增强功能（日志查看、统计信息、导出、分享、数据库持久化）"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prompt模板管理 (Priority: P1)

管理员需要管理系统中使用的各种Prompt模板，包括场景分析Prompt、示例生成Prompt等。管理员可以按使用场景分类查看、编辑和版本化管理这些Prompt。除了手工编辑外，管理员还可以输入需求描述，让AI自动生成或优化Prompt内容。

**Why this priority**: Prompt是AI分析质量的核心，将其从代码中解耦出来可以快速迭代优化，无需修改代码即可调整AI行为。

**Independent Test**: 可以通过创建一个新的Prompt模板、编辑内容、使用AI生成功能、保存并切换版本来完整测试此功能。

**Acceptance Scenarios**:

1. **Given** 管理员进入Prompt管理页面, **When** 查看Prompt列表, **Then** 系统显示按使用场景分类的所有Prompt模板（场景分析、示例生成等）
2. **Given** 管理员选择一个Prompt模板, **When** 点击编辑, **Then** 系统显示编辑器，支持编辑Prompt内容和查看变量占位符说明
3. **Given** 管理员修改Prompt内容后保存, **When** 保存成功, **Then** 系统自动创建新版本，保留历史版本记录
4. **Given** 管理员输入需求描述, **When** 点击"AI生成", **Then** 系统调用AI生成符合需求的Prompt内容供管理员审核和编辑
5. **Given** 管理员查看Prompt版本历史, **When** 选择某个历史版本, **Then** 可以查看该版本内容、对比差异、或回滚到该版本

---

### User Story 2 - 多AI Provider配置与选择 (Priority: P1)

系统支持配置多个AI服务提供商（如OpenAI、Azure OpenAI、本地LLM等）。每个Provider配置API端点和密钥后，系统自动查询该Provider支持的模型列表。用户在分析页面可以选择使用哪个Provider和模型进行分析。

**Why this priority**: 多Provider支持提供灵活性和容错能力，用户可以根据成本、性能、隐私需求选择不同的AI服务。

**Independent Test**: 可以通过添加多个AI Provider配置、验证模型自动发现、在分析页面切换Provider/模型来完整测试。

**Acceptance Scenarios**:

1. **Given** 管理员进入AI配置页面, **When** 点击添加Provider, **Then** 系统显示配置表单（名称、类型、API端点、API密钥）
2. **Given** 管理员保存Provider配置, **When** 配置有效, **Then** 系统自动调用API获取该Provider支持的模型列表并缓存
3. **Given** 用户在分析页面, **When** 点击AI设置, **Then** 系统显示可用的Provider和对应的模型列表供选择
4. **Given** 用户选择特定Provider和模型, **When** 发送分析请求, **Then** 系统使用选定的Provider和模型处理请求
5. **Given** Provider API密钥无效或服务不可用, **When** 尝试获取模型列表, **Then** 系统显示明确的错误提示，不影响其他Provider

---

### User Story 3 - 公司级信息维护 (Priority: P2)

管理员需要维护公司级的基础信息（如公司名称、业务模式、行业特点、会计准则偏好等）。这些信息作为AI分析的公共上下文，自动注入到Prompt中，确保AI理解业务背景。

**Why this priority**: 公司信息为AI分析提供必要的业务背景，虽然不是核心功能，但能显著提升分析准确性。

**Independent Test**: 可以通过编辑公司信息、进行AI分析、验证公司信息是否正确注入到Prompt中来测试。

**Acceptance Scenarios**:

1. **Given** 管理员进入公司设置页面, **When** 查看公司信息, **Then** 系统显示当前配置的公司基础信息
2. **Given** 管理员编辑公司信息, **When** 保存成功, **Then** 系统更新公司信息，后续AI分析将使用新信息
3. **Given** 用户进行场景分析, **When** AI处理请求, **Then** 公司信息自动作为上下文注入到Prompt中

---

### User Story 4 - 会话请求日志与响应统计 (Priority: P2)

用户在分析页面的对话中，可以查看每次请求发送给AI的完整内容（包括系统Prompt、用户消息、上下文等），以便调试和理解AI行为。同时，每次AI响应后显示统计信息（使用的模型、消耗的Token数、响应时间等）。

**Why this priority**: 透明的请求/响应信息帮助用户理解AI行为、调试问题、优化Prompt和控制成本。

**Independent Test**: 可以通过发送一条分析请求、点击日志按钮查看完整请求、查看响应统计信息来测试。

**Acceptance Scenarios**:

1. **Given** 用户发送一条消息, **When** 消息发送后, **Then** 该消息旁显示"查看日志"按钮
2. **Given** 用户点击"查看日志", **When** 弹出日志面板, **Then** 显示完整的请求信息（系统Prompt、上下文、用户消息）并支持复制
3. **Given** AI响应完成, **When** 响应显示后, **Then** 响应消息旁显示"统计信息"按钮
4. **Given** 用户点击"统计信息", **When** 弹出统计面板, **Then** 显示模型名称、输入Token数、输出Token数、总Token数、响应时间

---

### User Story 5 - 会话导出与分享 (Priority: P3)

用户可以将完整的会话历史导出为Markdown格式文件。同时，用户可以生成一个唯一的分享链接，其他人通过该链接可以在只读页面查看完整的对话过程（支持Markdown渲染）。

**Why this priority**: 导出和分享功能便于团队协作和知识沉淀，但属于增强功能，不影响核心分析流程。

**Independent Test**: 可以通过进行一次完整对话、导出为Markdown、生成分享链接、通过链接访问只读页面来测试。

**Acceptance Scenarios**:

1. **Given** 用户在分析页面有对话历史, **When** 点击"导出", **Then** 系统生成包含完整对话的Markdown文件并下载
2. **Given** 用户点击"分享", **When** 系统生成分享链接, **Then** 显示唯一的只读访问链接，支持复制
3. **Given** 访问者打开分享链接, **When** 页面加载, **Then** 显示只读的对话历史页面，支持Markdown渲染
4. **Given** 会话更新后, **When** 访问者刷新分享页面, **Then** 显示最新的对话内容

---

### User Story 6 - 会话数据库持久化 (Priority: P1)

会话历史从浏览器localStorage迁移到数据库存储。用户刷新页面或更换设备后，可以继续之前的会话。这也是分享功能的前提条件。

**Why this priority**: 数据库持久化是分享功能的基础，同时解决localStorage的容量限制和跨设备访问问题。

**Independent Test**: 可以通过进行对话、刷新页面、验证对话恢复、在其他设备访问同一场景来测试。

**Acceptance Scenarios**:

1. **Given** 用户发送消息或收到AI响应, **When** 消息产生, **Then** 系统自动将消息持久化到数据库
2. **Given** 用户刷新分析页面, **When** 页面加载, **Then** 系统从数据库加载会话历史并显示
3. **Given** 用户在另一设备访问同一场景, **When** 进入分析页面, **Then** 显示之前的会话历史
4. **Given** 会话包含请求日志和统计信息, **When** 数据持久化, **Then** 日志和统计信息也一并保存

---

### Edge Cases

1. **Prompt模板被删除但仍在使用**: 若当前激活的Prompt模板被删除，系统应回退到上一个版本或默认模板，并提示管理员
2. **AI Provider服务不可用**: 若选定的Provider不可用，系统应提示用户切换到其他可用的Provider
3. **模型列表获取失败**: 若无法从Provider获取模型列表，系统应允许用户手动输入模型名称
4. **会话数据量过大**: 若单个场景的会话历史超过一定阈值（如100条消息），系统应提示用户归档旧会话或开始新会话
5. **分享链接过期或被撤销**: 用户应能撤销分享链接，撤销后访问该链接显示"链接已失效"
6. **并发编辑Prompt**: 若多个管理员同时编辑同一Prompt，系统应使用乐观锁机制，后保存者看到冲突提示
7. **Token限制超出**: 若请求的Token数超出模型限制，系统应在发送前警告用户并建议截断上下文

## Requirements *(mandatory)*

### Functional Requirements

#### Prompt管理
- **FR-001**: 系统必须支持按使用场景（场景分析、示例生成、Prompt生成等）分类管理Prompt模板
- **FR-002**: 管理员必须能够创建、编辑、删除Prompt模板，编辑器需支持变量占位符高亮显示
- **FR-003**: 系统必须对每次Prompt修改自动创建新版本，支持查看版本历史、对比差异、回滚
- **FR-004**: 系统必须支持通过AI生成Prompt：用户输入需求描述，AI生成符合需求的Prompt内容
- **FR-005**: 每个使用场景必须有一个激活的Prompt版本，系统运行时使用激活版本

#### 多AI Provider
- **FR-006**: 系统必须支持配置多个AI Provider，每个Provider包含：名称、类型、API端点、API密钥、状态
- **FR-007**: Provider配置保存后，系统必须自动调用Provider的模型列表API获取支持的模型
- **FR-008**: 系统必须缓存模型列表，支持手动刷新，缓存失效时自动重新获取
- **FR-009**: 用户在分析页面必须能够选择使用的Provider和模型，选择持久化为用户偏好
- **FR-010**: 系统必须支持设置默认Provider和模型，新用户或未设置偏好时使用默认配置

#### 公司信息
- **FR-011**: 系统必须提供公司信息维护入口，支持编辑公司名称、业务模式、行业、会计准则偏好、其他备注
- **FR-012**: 公司信息必须作为Prompt变量自动注入到AI分析请求中

#### 会话增强
- **FR-013**: 每条用户消息必须可查看完整的AI请求日志（系统Prompt、上下文、用户消息）
- **FR-014**: 每条AI响应必须显示统计信息：使用的模型、输入/输出/总Token数、响应时间
- **FR-015**: 用户必须能够将会话导出为Markdown格式文件
- **FR-016**: 用户必须能够生成唯一的分享链接，通过链接可访问只读会话页面
- **FR-017**: 分享链接必须支持撤销，撤销后链接失效

#### 数据持久化
- **FR-018**: 会话消息必须实时持久化到数据库，包括：角色、内容、时间戳、请求日志、统计信息
- **FR-019**: 页面加载时必须从数据库恢复会话历史
- **FR-020**: 系统必须迁移现有localStorage中的会话数据到数据库（一次性迁移）

### Key Entities

- **PromptTemplate**: Prompt模板。属性：模板ID、使用场景（枚举：scenario_analysis/sample_generation/prompt_generation）、名称、描述、当前激活版本ID
- **PromptVersion**: Prompt版本。属性：版本ID、模板ID、版本号、内容、变量列表、创建者、创建时间、是否激活
- **AIProvider**: AI服务提供商。属性：Provider ID、名称、类型（枚举：openai/azure/ollama/custom）、API端点、加密API密钥、状态（启用/禁用）、是否默认、创建时间、更新时间
- **AIModel**: AI模型（缓存）。属性：模型ID、Provider ID、模型名称、模型能力（如context_length、支持的功能）、最后更新时间
- **CompanyProfile**: 公司信息（单例）。属性：公司名称、业务模式、行业、会计准则偏好、其他备注、更新时间
- **ConversationMessage**: 会话消息（扩展）。新增属性：请求日志（JSON）、响应统计（JSON：model、input_tokens、output_tokens、duration_ms）
- **ConversationShare**: 会话分享。属性：分享ID、场景ID、分享Token（唯一）、创建时间、过期时间、是否撤销

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 管理员可以在2分钟内完成一个新Prompt的创建和激活
- **SC-002**: AI生成Prompt的响应时间不超过30秒
- **SC-003**: Provider模型列表获取和缓存刷新时间不超过5秒
- **SC-004**: 用户切换Provider/模型后，下一次请求立即使用新配置
- **SC-005**: 会话消息持久化延迟不超过500ms，用户无感知
- **SC-006**: 页面刷新后会话恢复时间不超过1秒
- **SC-007**: 分享链接生成时间不超过1秒
- **SC-008**: 分享页面加载时间不超过2秒
- **SC-009**: Markdown导出包含完整会话内容，格式清晰可读
- **SC-010**: 请求日志和统计信息100%准确记录

## Assumptions & Dependencies

### Assumptions

1. AI Provider均提供标准的模型列表查询API（如OpenAI的/models端点）
2. 用户有稳定的网络连接以访问AI服务
3. 数据库有足够容量存储会话历史

### Dependencies

1. 依赖现有的AI配置基础设施（将被扩展）
2. 依赖现有的场景分析功能（将被增强）
3. 依赖数据库迁移能力以支持新表结构
