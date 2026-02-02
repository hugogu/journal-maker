# API Contract: Company Profile Management

**Version**: 1.0.0  
**Base Path**: `/api/company`  
**Status**: Draft

---

## Endpoints

### GET /api/company

获取公司信息（单例资源）。

**Response**:
```typescript
{
  id: string
  name: string
  businessModel: string | null
  industry: string | null
  accountingPreference: string | null
  notes: string | null
  updatedAt: string
}
```

**Note**: Always returns the single company record. Creates default if not exists.

---

### PUT /api/company

更新公司信息。

**Request**:
```typescript
{
  name?: string
  businessModel?: string
  industry?: string
  accountingPreference?: string
  notes?: string
}
```

**Response**: Updated company object

**Errors**:
- 400: Validation error (name required, max lengths)

---

## Context Injection

Company information is automatically injected into AI analysis prompts as a variable:

```
{{company.name}} - 公司名称
{{company.businessModel}} - 业务模式
{{company.industry}} - 行业
{{company.accountingPreference}} - 会计准则偏好
{{company.notes}} - 其他备注
```

This is handled internally by the AI service layer.
