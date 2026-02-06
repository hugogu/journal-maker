# 数据库迁移快速开始

## 🚀 快速迁移（5分钟）

```bash
# 1. 停止服务
docker-compose down -v  # 删除旧数据库卷

# 2. 启动数据库
docker-compose up -d

# 3. 运行迁移
npm run db:migrate

# 4. 初始化数据（如果有 seed 脚本）
npm run db:seed

# 5. 启动应用
npm run dev
```

## ✅ 验证

访问 http://localhost:3000 并测试：
1. 创建新场景
2. 与 AI 对话分析
3. 点击确认按钮
4. 检查右侧面板是否显示确认的科目和规则

## 📖 详细文档

查看 [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) 了解完整的迁移步骤和故障排除。

## 🔑 关键变更

- ❌ 删除了 `confirmed_analysis` (JSONB) 表
- ✅ 新增 `analysis_subjects` 规范化表
- ✅ 新增 `analysis_entries` 规范化表
- ✅ 新增 `analysis_diagrams` 规范化表
- ✅ 添加了完整的外键约束和索引
- ✅ 明确了 `journal_rules.debit_side/credit_side` 结构

## ⚠️ 注意事项

- 本次迁移会清空所有现有数据
- API 接口保持向后兼容
- UI 组件无需修改
