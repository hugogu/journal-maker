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
# 在仓库根目录配置 Docker Compose 环境变量
cp .env.example .env
# 编辑 .env，按需调整端口映射与文件挂载

# 启动数据库（在仓库根目录执行）
docker compose up -d postgres

# 进入应用目录并安装依赖
cd apps/accountflow
npm install

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

### 环境变量

```env
# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accountflow

# AI Provider加密密钥（重要）
# 用于加密存储AI Provider的API密钥
# 必须是32字符的字符串
# 开发环境可不设置，会使用默认值
# 生产环境必须设置自定义密钥
AI_KEY_ENCRYPTION_SECRET=your-32-character-secret-key-here

# 开发模式
MOCK_AI=true  # 使用模拟AI服务，无需真实API Key
```

#### AI_KEY_ENCRYPTION_SECRET 配置说明

**作用**：用于加密存储在数据库中的AI Provider API密钥。

**npm run 模式配置**：
```bash
# 方式1: 设置环境变量
export AI_KEY_ENCRYPTION_SECRET="your-32-character-secret-key-here"
npm run dev

# 方式2: 写入 .env 文件
echo "AI_KEY_ENCRYPTION_SECRET=your-32-character-secret-key-here" >> .env
npm run dev
```

**Docker 模式配置**：
```bash
# 推荐方式: 在仓库根目录 .env 中设置
# cp .env.example .env
# 编辑 .env，添加：
# AI_KEY_ENCRYPTION_SECRET=your-32-character-secret-key-here

# 启动
docker compose up -d
```

**安全提示**：
- 密钥必须是**32个字符**（支持字母、数字、符号）
- 生产环境**必须**设置自定义密钥，不要使用默认值
- 更改密钥后，已存储的API密钥将无法解密，需要重新配置
- 请妥善保管密钥，丢失后无法恢复已加密的API密钥

### Docker部署

```bash
# 在仓库根目录准备配置
cp .env.example .env

# 构建并启动所有服务
docker compose up -d

# 应用将运行在 http://localhost:3000
```

可通过根目录 `.env` 控制端口映射和挂载路径（示例见根目录 `.env.example`）：

```env
# 端口映射
APP_PORT=3000
DB_PORT=5432

# 文件挂载
DB_DATA_HOST_PATH=./postgres-data
DB_DATA_CONTAINER_PATH=/var/lib/postgresql/data
APP_DATA_HOST_PATH=./apps/accountflow/.data
APP_DATA_CONTAINER_PATH=/app/accountflow/.data
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
