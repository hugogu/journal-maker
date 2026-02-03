# Prompt 模板变量说明

## AI Service 支持的变量列表

### 会计科目相关

| 变量名 | 格式示例 | 说明 |
|--------|---------|------|
| `{{accounts}}` | `1001 现金 (asset), 1002 银行存款 (asset)` | 逗号分隔的简洁格式 |
| `{{accountsList}}` | `- 1001 现金 (asset)\n- 1002 银行存款 (asset)` | 多行列表格式，适合 Markdown |
| `{{accountsJson}}` | `[{"code":"1001","name":"现金","type":"asset"}]` | JSON 格式，适合程序处理 |

### 公司信息相关

| 变量名 | 示例 | 说明 |
|--------|------|------|
| `{{companyName}}` | `ABC科技有限公司` | 公司名称 |
| `{{businessModel}}` | `SaaS订阅服务` | 商业模式 |
| `{{industry}}` | `互联网/软件` | 所属行业 |
| `{{accountingPreference}}` | `权责发生制` | 会计偏好 |
| `{{companyContext}}` | `ABC科技有限公司 | SaaS订阅服务 | 互联网/软件` | 所有公司信息的组合摘要 |

### 场景相关

| 变量名 | 说明 |
|--------|------|
| `{{scenarioName}}` | 当前场景名称 |
| `{{scenarioDescription}}` | 当前场景描述 |

## 使用示例

### 基础用法

```markdown
请分析以下业务场景：{{scenarioDescription}}

可用会计科目：{{accountsList}}
```

### 完整上下文

```markdown
## 业务场景
{{scenarioDescription}}

## 公司背景
{{companyContext}}

## 可用会计科目
{{accountsList}}

请按以下步骤分析：
1. 识别关键业务事件
2. 选择合适会计科目
3. 绘制流程图
```

### 使用 JSON 数据（高级）

```markdown
请分析场景：{{scenarioDescription}}

会计科目数据：{{accountsJson}}

请根据以上科目，为每个业务事件分配合适的会计科目。
```

## 配置步骤

1. 在 Admin > Prompts 中创建新 Prompt
2. 设置 `scenarioType` 为 `scenario_analysis`
3. 将模板内容粘贴到 Prompt 编辑器
4. 激活该版本

## 模板文件位置

- 完整模板：`prompt-templates/scenario-analysis.md`

## 注意事项

1. 所有变量使用双大括号 `{{variableName}}`
2. 如果某个字段在数据库中为空，变量会被替换为空字符串
3. 推荐使用 `{{accountsList}}` 而不是 `{{accounts}}`，因为列表格式更易读
