# Plan: Multi-Agent Development Architecture

## Goal
建立 Claude Code Multi-Agent 开发架构，让 5 个专职 Agent 分工协作开发 YellowRiver 项目，提高开发效率和代码质量。

## Agent 架构

### 1. `planner` — 规划协调 Agent (Opus)
- 需求分析与任务拆解
- 维护 PLAN.md 和 TO-DO.md
- 协调其他 Agent，决定执行顺序
- 可调用其他 4 个 Agent

### 2. `frontend` — 前端 UI Agent (Sonnet)
- React 组件开发 (`src/components/`)
- 页面布局与路由 (`src/app/**/page.tsx`)
- Tailwind + Shadcn UI 样式
- 响应式设计与交互

### 3. `backend` — 后端 API Agent (Sonnet)
- API 路由 (`src/app/api/`)
- Prisma schema 与数据库操作
- Zod 验证 + 类型定义
- 邮件发送与服务端逻辑

### 4. `auth-infra` — 认证基础设施 Agent (Sonnet)
- Supabase Auth 集成
- Middleware 路由保护
- Storage + RLS 配置
- 环境变量与 CI/CD

### 5. `qa` — 质量保障 Agent (Sonnet, 只读)
- TypeScript 类型检查
- 构建验证
- 代码审查与安全检查
- 输出问题报告（不直接修改代码）

## 典型工作流

```
用户需求 → @planner 制定计划
         → @backend 开发 API（如需要）
         → @auth-infra 配置认证/存储（如需要）
         → @frontend 开发 UI
         → @qa 验证质量
         → @planner 更新 TO-DO.md
```

## 使用方式

### 在 Claude Code CLI 中
```bash
# 以特定 Agent 启动会话
claude --agent planner
claude --agent frontend

# 在会话中 @-mention 调用
@frontend 开发用户资料页面
@qa 检查最近的改动
```

## Changes
- [x] `.claude/agents/frontend.md` — 前端 Agent 定义
- [x] `.claude/agents/backend.md` — 后端 Agent 定义
- [x] `.claude/agents/auth-infra.md` — 认证基础设施 Agent 定义
- [x] `.claude/agents/qa.md` — QA Agent 定义
- [x] `.claude/agents/planner.md` — 规划协调 Agent 定义

## Testing
- 在 Claude Code 中运行 `/agents` 确认所有 Agent 可见
- 测试 `claude --agent planner` 能否正常启动
- 测试 Agent 间调用（planner 调用 frontend/backend/qa）

## Notes
- Planner Agent 使用 Opus 模型（更强的推理能力适合规划）
- QA Agent 是只读角色，不直接修改代码
- 所有 Agent 遵循 CLAUDE.md 中的 Plan Before Code 规则
- Agent 文件应提交到 Git，团队成员共享使用
