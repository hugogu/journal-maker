-- Migration: Initialize built-in prompt templates
-- This creates the default prompt templates for the system

-- Create default prompt templates for each scenario type

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
    '你是一个专业的会计场景分析助手。请分析用户描述的业务场景，并返回结构化的分析结果。

用户场景：{{scenarioDescription}}
{{#if companyContext}}
公司背景：{{companyContext}}
{{/if}}
{{#if accounts}}
可用会计科目：
{{#each accounts}}
- {{code}} {{name}} ({{type}})
{{/each}}
{{/if}}

请完成以下任务：
1. 识别业务场景中的关键事件和交易
2. 为每个事件确定合适的会计科目（借方和贷方）
3. 创建流程图描述业务流程
4. 生成会计分录规则

请严格按照以下 JSON 格式返回结果：
{
  "message": "分析总结（简要说明场景和主要会计处理）",
  "structured": {
    "flowchart": {
      "nodes": [
        {"id": "start", "type": "start", "label": "开始"},
        {"id": "event1", "type": "process", "label": "事件描述"},
        {"id": "decision1", "type": "decision", "label": "判断条件"},
        {"id": "end", "type": "end", "label": "结束"}
      ],
      "edges": [
        {"from": "start", "to": "event1", "label": ""},
        {"from": "event1", "to": "decision1", "label": ""},
        {"from": "decision1", "to": "end", "label": "是"}
      ]
    },
    "accounts": [
      {"code": "1001", "name": "库存现金", "type": "asset", "reason": "选择理由"}
    ],
    "rules": [
      {
        "event": "事件描述",
        "debit": "借方科目代码",
        "credit": "贷方科目代码",
        "description": "分录说明"
      }
    ]
  }
}

注意事项：
- 必须返回有效的 JSON 格式
- nodes 和 edges 要完整描述业务流程
- accounts 中的 type 必须是：asset, liability, equity, revenue, expense 之一
- rules 要涵盖所有识别的业务事件',
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
