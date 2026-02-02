# Quickstart: Prompt版本化管理与AI服务增强

**Feature**: 002-prompt-ai-management  
**Branch**: `002-prompt-ai-management`  
**Status**: Implementation Ready

---

## Prerequisites

- PostgreSQL 15+ running
- Node.js 20+ with pnpm
- Existing 001-accounting-ai-mvp database

---

## Setup Steps

### 1. Checkout Feature Branch

```bash
git checkout 002-prompt-ai-management
```

### 2. Database Migration

```bash
cd apps/accountflow

# Run new migrations
pnpm db:migrate

# (Optional) Migrate localStorage data
# Go to any scenario analysis page
# System will prompt to migrate existing conversations
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Environment Variables

Add to `.env`:

```env
# AI Provider encryption key (for API keys)
AI_KEY_ENCRYPTION_SECRET=your-32-char-secret-here
```

### 5. Start Development Server

```bash
pnpm dev
```

---

## First Time Setup

### 1. Configure Company Profile

1. Go to **Admin → Company Settings**
2. Fill in:
   - Company Name
   - Business Model (e.g., "B2B SaaS platform")
   - Industry
   - Accounting Preferences
3. Save

This information will be injected into all AI analysis prompts.

### 2. Add AI Provider(s)

1. Go to **Admin → AI Configuration**
2. Click "Add Provider"
3. Fill in:
   - Name: "OpenAI" (or your preferred name)
   - Type: openai
   - API Endpoint: `https://api.openai.com/v1`
   - API Key: your-api-key
4. Check "Set as Default"
5. Save

The system will automatically fetch available models.

### 3. Review Prompt Templates

1. Go to **Admin → Prompt Management**
2. Review default templates for each scenario type:
   - Scenario Analysis
   - Sample Generation
   - Prompt Generation
3. Edit or regenerate using AI if needed

---

## User Workflow

### For Product Users

1. **Select AI Provider** (in Analysis page):
   - Click "AI Settings" in the analysis page
   - Choose Provider and Model
   - Selection is remembered for future sessions

2. **View Request Logs**:
   - Click "📋 View Log" on any user message
   - See complete request including system prompt and context
   - Click "Copy" to copy full request

3. **View Response Statistics**:
   - Click "📊 Stats" on any AI response
   - See model, token usage, response time

4. **Export Conversation**:
   - Click "Export" button
   - Choose format (Markdown/JSON)
   - Download file

5. **Share Conversation**:
   - Click "Share" button
   - Copy the generated link
   - Share with team members
   - Revoke access anytime from Admin

---

## Common Operations

### Regenerate Prompt Using AI

1. Go to **Admin → Prompt Management**
2. Select a template
3. Click "AI Generate"
4. Describe what the Prompt should do
5. Review generated content
6. Save as new version

### Switch AI Provider

1. In Analysis page, click "AI Settings"
2. Select different Provider
3. Select Model
4. New requests will use selected configuration

### Revoke Share Link

1. Go to **Admin → Share Management**
2. Find the link to revoke
3. Click "Revoke"
4. Link becomes invalid immediately

---

## Testing

### Run Unit Tests

```bash
pnpm test:unit
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Manual Testing Checklist

- [ ] Create and edit Prompt template
- [ ] AI generate new Prompt
- [ ] Add multiple AI Providers
- [ ] Switch Provider in analysis page
- [ ] View request logs
- [ ] View response statistics
- [ ] Export conversation
- [ ] Create share link
- [ ] Access share link (incognito)
- [ ] Revoke share link
- [ ] Cross-device conversation persistence

---

## Troubleshooting

### Model List Not Loading

- Check Provider API endpoint and key
- Click "Refresh Models" button
- Check browser console for errors

### Share Link 404

- Verify link not revoked
- Check token in URL matches database
- Ensure scenario still exists

### Migration Issues

- LocalStorage data can be manually exported/imported
- Check browser console for migration errors

---

**Ready for Implementation** 🚀
