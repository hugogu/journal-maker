# Journal Maker - AI辅助会计规则分析工具

<div align="center">

**AI驱动的会计规则分析与流程可视化平台**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/vue.js-3.x-green)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescript.org/)

</div>

## 📖 项目简介

Journal Maker 是一个创新的 AI 辅助会计规则分析工具，通过智能分析业务场景，自动生成会计分录规则和流程图。该工具旨在帮助会计人员、财务分析师和业务分析师快速理解复杂业务场景的会计处理逻辑，提高工作效率和准确性。

### 🎯 核心价值

- **智能分析**：基于 AI 技术自动分析业务场景，识别关键会计事件
- **流程可视化**：实时生成业务流程图和资金流向图
- **规则生成**：自动生成符合会计准则的分录规则
- **结构化输出**：提供 Markdown 和 JSON 双格式输出

## ✨ 主要功能

### 🏗️ 场景管理
- 创建和管理业务场景
- 支持场景模板化
- 场景版本控制
- 场景分享与协作

### 🤖 AI 智能分析
- 多种 AI 模型支持（OpenAI、Claude、Gemini 等）
- 实时流式分析响应
- 对话历史记录
- 自定义分析提示词

### 📊 可视化展示
- **业务流程图**：Mermaid 格式，展示业务处理步骤
- **资金流图**：直观显示资金流向和金额变化
- **信息流图**：展示信息传递路径
- **交互式图表**：支持缩放和导出

### 📋 会计规则管理
- 自动生成会计分录规则
- 科目映射与匹配
- 借贷平衡验证
- 规则版本管理

### 🏛️ 科目管理
- 完整的会计科目表
- 科目分类与搜索
- 自定义科目配置
- 科目使用统计

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0 (可选，用于缓存)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/hugogu/journal-maker.git
cd journal-maker
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# 配置数据库连接、AI API 密钥等
```

4. **数据库初始化**
```bash
# 运行数据库迁移
npm run db:migrate

# 初始化基础数据
npm run db:seed
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
```
http://localhost:3000
```

### Docker 部署

```bash
# 复制配置模板
cp .env.example .env

# 按需编辑 .env：端口映射与文件挂载
# APP_PORT=3000
# DB_PORT=5432
# DB_DATA_HOST_PATH=./postgres-data
# APP_DATA_HOST_PATH=./apps/accountflow/.data

# 启动服务
docker compose up -d
```

首次启动时会在应用容器内自动执行数据库迁移，无需手工运行 `npm run db:migrate`。

默认访问地址：`http://localhost:3000`

## 📁 项目结构

```
journal-maker/
├── apps/
│   └── accountflow/              # 主应用
│       ├── src/
│       │   ├── components/       # Vue 组件
│       │   ├── pages/           # 页面组件
│       │   ├── server/          # 服务端代码
│       │   │   ├── api/         # API 路由
│       │   │   ├── utils/       # 工具函数
│       │   │   └── types/       # 类型定义
│       │   └── styles/          # 样式文件
│       ├── public/               # 静态资源
│       └── tests/               # 测试文件
├── packages/                     # 共享包
│   ├── database/                # 数据库相关
│   ├── ai-adapter/              # AI 适配器
│   └── types/                   # 共享类型
├── docs/                        # 文档
├── screenshots/                 # 截图文件
├── docker-compose.yml           # Docker 编排
├── package.json                 # 项目配置
└── README.md                    # 项目说明
```

## 🎮 使用指南

### 基本流程

1. **创建场景**：定义业务场景的基本信息
2. **AI 分析**：与 AI 对话，分析会计处理逻辑
3. **确认结果**：保存分析结果到场景
4. **导出使用**：导出分析结果供实际业务使用

### 详细教程

- 📖 [完整使用指南](USAGE-GUIDE.md)
- 🎬 [视频教程](https://example.com/tutorials)
- 📝 [API 文档](https://example.com/api-docs)

## 🔧 技术架构

### 前端技术栈

- **Vue 3**：渐进式 JavaScript 框架
- **Nuxt 3**：Vue 应用框架
- **TypeScript**：类型安全的 JavaScript
- **Tailwind CSS**：实用优先的 CSS 框架
- **Pinia**：状态管理库

### 后端技术栈

- **Node.js**：JavaScript 运行时
- **Nitro**：全栈 Web 框架
- **Prisma**：数据库 ORM
- **PostgreSQL**：关系型数据库
- **Redis**：内存数据库（缓存）

### AI 集成

- **OpenAI API**：GPT 系列模型
- **Anthropic Claude**：Claude 系列模型
- **Google Gemini**：Gemini 系列模型
- **自定义适配器**：支持扩展其他 AI 服务

### 可视化组件

- **Mermaid.js**：图表和流程图生成
- **D3.js**：数据可视化
- **Cytoscape.js**：网络图可视化

## 🔌 API 接口

### 场景管理

```typescript
// 获取场景列表
GET /api/scenarios

// 创建场景
POST /api/scenarios
{
  "name": "场景名称",
  "description": "场景描述",
  "isTemplate": false
}

// 获取场景详情
GET /api/scenarios/:id

// 更新场景
PUT /api/scenarios/:id
```

### AI 分析

```typescript
// 流式分析
POST /api/scenarios/:id/analyze.stream
{
  "content": "分析请求内容",
  "providerId": 1,
  "model": "gpt-4"
}
```

### 科目管理

```typescript
// 获取科目列表
GET /api/accounts

// 创建科目
POST /api/accounts
{
  "code": "1001",
  "name": "现金",
  "type": "asset",
  "direction": "debit"
}
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

### 测试结构

```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
├── e2e/           # 端到端测试
└── fixtures/      # 测试数据
```

## 📊 性能优化

### 前端优化

- **代码分割**：按路由分割代码
- **懒加载**：组件和页面懒加载
- **缓存策略**：合理的 HTTP 缓存配置
- **图片优化**：WebP 格式和响应式图片

### 后端优化

- **数据库索引**：关键字段建立索引
- **查询优化**：避免 N+1 查询
- **缓存机制**：Redis 缓存热点数据
- **连接池**：数据库连接池管理

### AI 优化

- **请求合并**：批量处理相似请求
- **结果缓存**：缓存常见分析结果
- **流式响应**：实时返回分析结果
- **错误重试**：智能重试机制

## 🔒 安全性

### 数据安全

- **加密存储**：敏感数据加密存储
- **传输加密**：HTTPS/WSS 加密传输
- **访问控制**：基于角色的权限控制
- **审计日志**：完整的操作审计

### AI 安全

- **API 密钥管理**：安全的密钥存储
- **输入验证**：严格的输入验证
- **输出过滤**：敏感信息过滤
- **使用限制**：防止 API 滥用

## 🚀 部署

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 使用 PM2 管理进程
pm2 start ecosystem.config.js
```

### 环境变量配置

```bash
# 数据库配置
DATABASE_URL="postgresql://user:pass@localhost:5432/accountflow"

# AI API 配置
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# 应用配置
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"

# 安全配置
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-encryption-key"
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题**：在 Issues 中报告 bug 或提出建议
2. **提交代码**：Fork 项目，创建分支，提交 Pull Request
3. **改进文档**：完善文档和示例
4. **分享经验**：分享使用经验和最佳实践

### 开发流程

1. Fork 项目到个人仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 和 Prettier 格式化代码
- 遵循 TypeScript 最佳实践
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

Copyright 2026 Hugo Gu

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## 🙏 致谢

感谢以下开源项目和服务：

- [Vue.js](https://vuejs.org/) - 前端框架
- [Nuxt.js](https://nuxt.com/) - 全栈框架
- [Prisma](https://www.prisma.io/) - 数据库 ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Mermaid.js](https://mermaid.js.org/) - 图表库
- [OpenAI](https://openai.com/) - AI 服务
- [Anthropic](https://anthropic.com/) - AI 服务

## 📞 联系我们

- **项目主页**：https://github.com/hugogu/journal-maker
- **问题反馈**：https://github.com/hugogu/journal-maker/issues
- **讨论区**：https://github.com/hugogu/journal-maker/discussions
- **邮箱**：hugogu@outlook.com

## 🗺️ 路线图

### v1.0.0 (当前版本)
- ✅ 基础场景管理
- ✅ AI 分析功能
- ✅ 流程图生成
- ✅ 会计规则管理

### v1.1.0 (计划中)
- 🔄 批量场景分析
- 🔄 自定义模板
- 🔄 数据导出增强
- 🔄 性能优化

### v1.2.0 (规划中)
- 📋 协作功能
- 📋 版本控制
- 📋 审批流程
- 📋 权限管理

### v2.0.0 (长期规划)
- 🚀 多租户支持
- 🚀 插件系统
- 🚀 移动端应用
- 🚀 API 开放平台

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

Made with ❤️ by [Hugo Gu](https://github.com/hugogu)

</div>
