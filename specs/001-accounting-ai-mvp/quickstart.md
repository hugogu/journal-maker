# Quick Start Guide

**Project**: AccountFlow (AI辅助会计规则分析工具)  
**Tech Stack**: Nuxt 3 + PostgreSQL + OpenAI API

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

---

## Quick Start (Docker - Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd journal-maker/apps/accountflow

# 2. Start with Docker Compose
docker-compose up

# 3. Open browser
open http://localhost:3000
```

**Default credentials**:
- Admin user: `admin` (passwordless in dev mode)
- Product user: `product` (passwordless in dev mode)

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accountflow

# AI Config (required for AI features)
OPENAI_API_KEY=sk-...
OPENAI_API_ENDPOINT=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# Mock AI for offline development
MOCK_AI=false
```

### 3. Database Setup

```bash
# Start PostgreSQL
docker-compose up -d db

# Run migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed
```

### 4. Start Dev Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
apps/accountflow/
├── src/
│   ├── components/      # Vue components
│   │   ├── ui/         # Generic UI (Button, Modal)
│   │   └── accounting/ # Domain-specific (AccountPicker)
│   ├── composables/     # Vue composables
│   │   ├── useAI.ts
│   │   ├── useAccounts.ts
│   │   └── useScenarios.ts
│   ├── pages/          # Nuxt pages (file-based routing)
│   │   ├── index.vue
│   │   ├── admin/
│   │   └── scenarios/
│   ├── server/         # Nuxt server API
│   │   ├── api/        # API routes
│   │   └── db/         # Database schema & migrations
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── tests/
│   ├── unit/           # Vitest tests
│   └── e2e/            # Playwright tests
└── docker-compose.yml
```

---

## Common Tasks

### Database

```bash
# Create new migration
npm run db:generate -- <name>

# Run migrations
npm run db:migrate

# Reset database (dev only!)
npm run db:reset

# Open Drizzle Studio (DB GUI)
npm run db:studio
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e -- --ui
```

### Code Quality

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format
```

---

## First Time Setup (Admin)

1. **Configure AI Service**
   - Go to `/admin/ai-config`
   - Enter OpenAI API Key
   - Test connection

2. **Create Shared Accounts**
   - Go to `/accounts`
   - Add common accounts (现金、银行存款、应收账款等)

3. **Create Template Scenario**
   - Go to `/scenarios/new`
   - Create a standard scenario as template
   - Run AI analysis to generate rules
   - Mark as template

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `OPENAI_API_ENDPOINT` | API endpoint | https://api.openai.com/v1 |
| `OPENAI_MODEL` | Model name | gpt-4 |
| `MOCK_AI` | Use mock responses | false |
| `NUXT_PORT` | Server port | 3000 |
| `NUXT_HOST` | Server host | 0.0.0.0 |

---

## Troubleshooting

### Database connection failed

```bash
# Check if Postgres is running
docker-compose ps

# View logs
docker-compose logs db

# Reset and recreate
docker-compose down -v
docker-compose up -d db
npm run db:migrate
```

### AI API errors

```bash
# Enable mock mode for offline development
MOCK_AI=true npm run dev
```

### Port 3000 in use

```bash
# Use different port
NUXT_PORT=3001 npm run dev
```

---

## Production Deployment

```bash
# Build Docker image
docker build -t accountflow .

# Run with production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Required prod env vars**:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `NUXT_SESSION_PASSWORD` (random 32+ chars)

---

## Tech Stack Details

| Category | Technology |
|----------|------------|
| Framework | Nuxt 3.15 |
| UI | Vue 3.5, TailwindCSS |
| Database | PostgreSQL 15, drizzle-orm |
| AI | OpenAI SDK 4.x |
| Charts | Mermaid 11.x |
| Tables | TanStack Table |
| Testing | Vitest, Playwright |
| Export | xlsx (SheetJS) |

---

## Need Help?

- Check [spec.md](../spec.md) for feature details
- Check [data-model.md](../data-model.md) for database schema
- Check [contracts/api.md](./api.md) for API documentation
