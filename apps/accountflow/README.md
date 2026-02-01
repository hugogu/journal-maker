# AccountFlow - AI辅助会计规则分析工具

AI-assisted accounting rule analysis tool for business scenarios.

## 功能特性

- **场景分析**：创建业务场景，AI辅助分析会计规则
- **流程可视化**：实时流程图展示信息流和资金流  
- **示例交易**：自动生成完整示例记账数据
- **结构化导出**：支持JSON和Excel格式导出

## 技术栈

- Vue 3 + Nuxt 3
- TypeScript
- PostgreSQL + drizzle-orm
- TailwindCSS
- Mermaid.js

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 15+
- Docker (可选)

### 安装

```bash
# 进入项目目录
cd apps/accountflow

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接和AI配置

# 启动数据库
docker-compose up -d postgres

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accountflow

# AI配置
OPENAI_API_KEY=your-api-key
OPENAI_API_ENDPOINT=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# 开发模式
MOCK_AI=true  # 使用模拟AI服务，无需真实API Key
```

### Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 应用将运行在 http://localhost:3000
```

## 项目结构

```
apps/accountflow/
├── src/
│   ├── components/     # Vue组件
│   ├── layouts/        # 布局组件
│   ├── pages/          # 页面
│   ├── server/         # API路由和服务端代码
│   │   ├── api/        # API端点
│   │   ├── db/         # 数据库配置和schema
│   │   └── utils/      # 服务端工具
│   ├── types/          # TypeScript类型
│   └── assets/         # 静态资源
├── docker-compose.yml
├── nuxt.config.ts
└── package.json
```

## 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 数据库操作
npm run db:migrate   # 运行迁移
npm run db:generate  # 生成迁移文件
npm run db:studio    # 打开Drizzle Studio
```

## 使用指南

1. **初始配置**：访问 `/admin/ai-config` 配置AI服务
2. **管理科目**：访问 `/accounts` 管理会计科目
3. **创建场景**：访问 `/scenarios/new` 创建业务场景
4. **AI分析**：在场景详情页与AI对话，分析会计规则
5. **查看示例**：在 `/scenarios/[id]/transactions` 查看示例交易
6. **导出数据**：使用导出功能下载分析结果

## 许可证

MIT
