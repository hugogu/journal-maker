-- ============================================================================
-- AccountFlow Database - Initial Data Migration
-- ============================================================================
-- Version: 1.0
-- Created: 2026-02-06
-- Description: Initialize default data for AccountFlow system including
--              company profile, default user, and built-in prompt templates.
-- ============================================================================

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default company profile
INSERT INTO "public"."company_profile" ("name", "business_model", "industry", "accounting_preference")
VALUES ('默认公司', '请在管理页面配置公司信息', '未指定', '中国企业会计准则')
RETURNING id;

-- Insert default user (linked to default company)
INSERT INTO "public"."users" ("company_id", "name", "email", "role")
VALUES (1, '默认用户', 'admin@example.com', 'admin');

-- ============================================================================
-- BUILT-IN PROMPT TEMPLATES
-- ============================================================================

-- 1. Scenario Analysis Prompt
INSERT INTO prompt_templates (scenario_type, name, description, active_version_id, created_at, updated_at)
VALUES (
  'scenario_analysis',
  '场景分析默认模板',
  '用于分析业务场景并生成会计分录规则',
  NULL,
  NOW(),
  NOW()
) RETURNING id;

DO $$
DECLARE
  v_template_id INTEGER;
  v_version_id INTEGER;
BEGIN
  -- Get the template id
  SELECT id INTO v_template_id FROM prompt_templates 
  WHERE scenario_type = 'scenario_analysis' AND name = '场景分析默认模板';

  -- Create initial version with JSON format response
  INSERT INTO prompt_versions (template_id, version_number, content, variables, created_at, created_by)
  VALUES (
    v_template_id,
    1,
    '# 会计场景分析 Prompt

## 系统角色
你是一个专业的会计场景分析助手。请分析用户描述的业务场景。

## 输入变量

- `{{scenarioDescription}}` - 用户描述的业务场景
- `{{companyContext}}` - 公司背景信息（可选）
- `{{accounts}}` - 可用会计科目列表（可选）

## Prompt 内容

用户场景：{{scenarioDescription}}

公司名：{{companyName}}
业务介绍：{{businessModel}}
行业：{{industry}}
记账偏好：{{accountingPreference}}

可用会计科目：
{{accountsList}}

请按以下步骤进行分析，并以 Markdown 格式输出你的思考过程：

## 1. 业务场景理解
简要描述你对该业务场景的理解，包括主要参与方、业务流程和关键交易环节。

## 2. 关键事件识别
列出场景中的关键业务事件，并解释每个事件的会计含义。

## 3. 会计科目选择
为每个事件选择合适的会计科目，说明选择理由。

## 4. 业务流程图 (Mermaid)
使用 mermaid 语法绘制业务流程图：

```mermaid
flowchart TD
    Start[开始] --> Event1[事件1描述]
    Event1 --> Decision1{判断条件?}
    Decision1 -->|是| Event2[事件2]
    Decision1 -->|否| End[结束]
    Event2 --> End
```
IMPORTANT: When creating mermaid flowchart nodes, avoid using square brackets [], parentheses (), or other special characters in node labels. Use simple descriptive text instead.

## 5. 资金/信息流图 (Mermaid)
绘制一次典型交易中，各账户间的资金流（实线）和信息流（虚线）：

```mermaid
flowchart LR
    subgraph 客户侧
        A[客户账户]
    end
    subgraph 财务侧
        B[应收账款-科目:1122]
        C[银行存款-科目:1002]
    end
    A -.->|订单信息| B
    B ==>|付款| C
```

## 6. 会计分录规则
以表格形式列出会计分录规则：

| 业务事件 | 借方科目 | 贷方科目 | 分录说明 |
|---------|---------|---------|---------|
| 事件描述 | 科目代码 | 科目代码 | 说明文字 |

---

在回复的最后，请提供一个可解析的 JSON 数据块（用于系统存储和后续处理）：

```json
{
  "message": "分析总结（简要说明场景和主要会计处理）",
  "structured": {
    "flowchart": {
      "nodes": [
        {"id": "start", "type": "start", "label": "开始"},
        {"id": "event1", "type": "process", "label": "事件描述"}
      ],
      "edges": [
        {"from": "start", "to": "event1", "label": ""}
      ]
    },
    "accounts": [
      {"code": "1001", "name": "库存现金", "type": "asset", "reason": "选择理由"}
    ],
    "rules": [
      {
        "event": "事件名称",
        "debit": "借方科目代码（不要有金额，只能有一个）",
        "credit": "贷方科目代码（不要有金额，只能有一个）",
        "description": "分录说明"
      }
    ]
  }
}
```

注意事项：
- 前面的 Markdown 分析是给用户看的，要详细、清晰、易读
- 最后的 JSON 代码块是给系统解析用的，必须严格符合格式
- accounts 中的 type 必须是：asset, liability, equity, revenue, expense 之一',
    '["scenarioDescription", "companyContext", "accounts"]',
    NOW(),
    NULL
  ) RETURNING id INTO v_version_id;

  -- Activate the version
  UPDATE prompt_templates 
  SET active_version_id = v_version_id
  WHERE id = v_template_id;
END $$;

-- 2. Sample Generation Prompt
INSERT INTO prompt_templates (scenario_type, name, description, active_version_id, created_at, updated_at)
VALUES (
  'sample_generation',
  '示例生成默认模板',
  '根据场景规则生成会计分录示例数据',
  NULL,
  NOW(),
  NOW()
);

DO $$
DECLARE
  v_template_id INTEGER;
  v_version_id INTEGER;
BEGIN
  SELECT id INTO v_template_id FROM prompt_templates 
  WHERE scenario_type = 'sample_generation' AND name = '示例生成默认模板';

  INSERT INTO prompt_versions (template_id, version_number, content, variables, created_at, created_by)
  VALUES (
    v_template_id,
    1,
    '你是一个会计示例生成助手。请根据提供的场景规则和会计科目，生成具体的会计分录示例。

场景名称：{{scenarioName}}
{{#if scenarioDescription}}
场景描述：{{scenarioDescription}}
{{/if}}

会计规则：
{{rules}}

可用会计科目：
{{accounts}}

{{#if count}}
请生成 {{count}} 条示例分录。
{{else}}
请生成 5 条示例分录。
{{/if}}

请以 JSON 数组格式返回结果：
[
  {
    "date": "2024-01-15",
    "description": "业务描述",
    "amount": 10000,
    "debitAccount": "借方科目代码",
    "debitAccountName": "借方科目名称",
    "creditAccount": "贷方科目代码",
    "creditAccountName": "贷方科目名称"
  }
]

注意事项：
- 日期应在合理范围内
- 金额要符合业务逻辑
- 借贷科目必须匹配规则',
    '["scenarioName", "scenarioDescription", "rules", "accounts", "count"]',
    NOW(),
    NULL
  ) RETURNING id INTO v_version_id;

  UPDATE prompt_templates 
  SET active_version_id = v_version_id
  WHERE id = v_template_id;
END $$;

-- 3. Prompt Generation Prompt (for AI-assisted prompt creation)
INSERT INTO prompt_templates (scenario_type, name, description, active_version_id, created_at, updated_at)
VALUES (
  'prompt_generation',
  'Prompt生成助手模板',
  '用于AI辅助生成Prompt内容',
  NULL,
  NOW(),
  NOW()
);

DO $$
DECLARE
  v_template_id INTEGER;
  v_version_id INTEGER;
BEGIN
  SELECT id INTO v_template_id FROM prompt_templates 
  WHERE scenario_type = 'prompt_generation' AND name = 'Prompt生成助手模板';

  INSERT INTO prompt_versions (template_id, version_number, content, variables, created_at, created_by)
  VALUES (
    v_template_id,
    1,
    '你是一个专业的Prompt工程师。请根据用户需求生成高质量的系统Prompt。

场景类型：{{scenarioType}}
需求描述：{{requirementDescription}}

请生成一个系统Prompt，要求：
1. 明确AI的角色和任务
2. 包含必要的上下文信息
3. 指定输出格式
4. 使用 {{variableName}} 语法标注变量

直接返回Prompt内容，不要包含解释。',
    '["scenarioType", "requirementDescription"]',
    NOW(),
    NULL
  ) RETURNING id INTO v_version_id;

  UPDATE prompt_templates 
  SET active_version_id = v_version_id
  WHERE id = v_template_id;
END $$;

-- 4. Flowchart Generation Prompt
INSERT INTO prompt_templates (scenario_type, name, description, active_version_id, created_at, updated_at)
VALUES (
  'flowchart_generation',
  '流程图生成默认模板',
  '用于生成业务流程图',
  NULL,
  NOW(),
  NOW()
);

DO $$
DECLARE
  v_template_id INTEGER;
  v_version_id INTEGER;
BEGIN
  SELECT id INTO v_template_id FROM prompt_templates 
  WHERE scenario_type = 'flowchart_generation' AND name = '流程图生成默认模板';

  INSERT INTO prompt_versions (template_id, version_number, content, variables, created_at, created_by)
  VALUES (
    v_template_id,
    1,
    '你是一个流程图生成专家。请根据业务场景描述生成Mermaid流程图代码。

业务场景：{{scenarioDescription}}
{{#if rules}}
业务规则：
{{rules}}
{{/if}}

请生成Mermaid流程图，包含：
- 开始/结束节点
- 业务处理步骤
- 判断条件
- 流程走向

请以如下格式返回：
```mermaid
flowchart TD
    Start([开始]) --> Step1[步骤1]
    Step1 --> Decision{判断}
    Decision -->|条件1| Step2[步骤2]
    Decision -->|条件2| End([结束])
```',
    '["scenarioDescription", "rules"]',
    NOW(),
    NULL
  ) RETURNING id INTO v_version_id;

  UPDATE prompt_templates 
  SET active_version_id = v_version_id
  WHERE id = v_template_id;
END $$;

COMMENT ON TABLE prompt_templates IS 'Initialized with 4 built-in templates: scenario_analysis, sample_generation, prompt_generation, flowchart_generation';
