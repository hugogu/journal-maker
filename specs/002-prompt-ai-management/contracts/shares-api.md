# API Contract: Conversation Sharing

**Version**: 1.0.0  
**Base Path**: `/api/shares`  
**Status**: Draft

---

## Endpoints

### POST /api/scenarios/:id/shares

创建会话分享链接。

**Request**:
```typescript
{
  // No body required, or optional:
  note?: string // 内部备注（不显示给访问者）
}
```

**Response**:
```typescript
{
  id: string
  scenarioId: string
  shareToken: string
  shareUrl: string // 完整URL: https://.../share/{token}
  createdAt: string
  isRevoked: false
}
```

---

### GET /api/scenarios/:id/shares

获取场景的所有分享链接。

**Response**:
```typescript
{
  shares: Array<{
    id: string
    shareToken: string
    shareUrl: string
    createdAt: string
    isRevoked: boolean
    revokedAt: string | null
  }>
}
```

---

### POST /api/shares/:id/revoke

撤销分享链接。

**Response**:
```typescript
{
  id: string
  isRevoked: true
  revokedAt: string
}
```

---

### DELETE /api/shares/:id

删除分享链接记录（物理删除）。

**Response**: 204 No Content

---

## Public Share Access

### GET /share/:token

访问分享页面（只读，无需认证）。

**Response**: HTML page with conversation rendered

**Page Features**:
- Read-only conversation view
- Markdown rendering for messages
- No input/chat functionality
- "Powered by AccountFlow" branding

---

### GET /api/shares/:token/conversation

获取分享链接对应的会话数据（供分享页面使用）。

**Response**:
```typescript
{
  shareToken: string
  scenario: {
    id: string
    name: string
    description: string | null
  }
  messages: Array<{
    role: string
    content: string
    timestamp: string
  }>
  sharedAt: string
}
```

**Errors**:
- 404: Share not found or revoked

---

## Export via Share

### GET /share/:token/export

导出分享的会话（公开访问，无需认证）。

**Query**: `?format=markdown|json`

**Response**: File download

---

## Security Considerations

1. **Token Entropy**: 32-character hex string (128 bits)
2. **No Authentication**: Public access by design
3. **Revocation**: Immediate effect, no caching
4. **Read-only**: No mutation operations allowed
