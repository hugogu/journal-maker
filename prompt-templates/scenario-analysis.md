# 会计场景分析 Prompt 模板

## 系统角色
你是一个专业的会计场景分析助手。请分析用户描述的业务场景。

## 可用变量

- `{{accounts}}` - 逗号分隔的会计科目列表 (如: "1001 现金 (asset), 1002 银行存款 (asset)")
- `{{accountsList}}` - 多行格式会计科目列表 (如: "- 1001 现金 (asset)\n- 1002 银行存款 (asset)")
- `{{accountsJson}}` - JSON 格式的会计科目数组
- `{{companyName}}` - 公司名称
- `{{businessModel}}` - 商业模式
- `{{industry}}` - 行业
- `{{accountingPreference}}` - 会计偏好
- `{{companyContext}}` - 公司背景摘要 (组合字段)
- `{{scenarioName}}` - 场景名称
- `{{scenarioDescription}}` - 场景描述

## Prompt 内容

用户场景：{{scenarioDescription}}

{{companyName}}
{{businessModel}}
{{industry}}
{{accountingPreference}}

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
    Start([开始]) --> Event1[事件1描述]
    Event1 --> Decision1{判断条件?}
    Decision1 -->|是| Event2[事件2]
    Decision1 -->|否| End([结束])
    Event2 --> End
```

## 5. 资金/信息流图 (Mermaid)
绘制一次典型交易中，各账户间的资金流（实线）和信息流（虚线）：

```mermaid
flowchart LR
    subgraph 客户侧
        A[客户账户]
    end
    subgraph 财务侧
        B[应收账款<br/>科目:1122]
        C[银行存款<br/>科目:1002]
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
        "event": "事件描述",
        "debit": "借方科目代码",
        "credit": "贷方科目代码",
        "description": "分录说明"
      }
    ]
  }
}
```

注意事项：
- 前面的 Markdown 分析是给用户看的，要详细、清晰、易读
- 最后的 JSON 代码块是给系统解析用的，必须严格符合格式
- accounts 中的 type 必须是：asset, liability, equity, revenue, expense 之一
