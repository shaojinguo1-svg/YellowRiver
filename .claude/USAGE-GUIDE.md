# YellowRiver Claude Code Multi-Agent 使用指南

## 前提条件

1. 已安装 Claude Code CLI（终端里能运行 `claude` 命令）
2. 已登录 Claude Code（`claude auth login`）
3. 在终端里 `cd` 到 YellowRiver 项目目录

```bash
cd ~/YellowRiver
```

---

## 你的 Agent 团队

| Agent | 角色 | 擅长 |
|-------|------|------|
| `planner` | 项目经理 | 制定计划、拆解任务、调度其他 Agent |
| `frontend` | 前端开发 | React 组件、页面、样式、交互 |
| `backend` | 后端开发 | API 路由、数据库、验证、邮件 |
| `auth-infra` | 基础设施 | 认证、权限、Storage、CI/CD |
| `qa` | 质量保障 | 类型检查、构建验证、代码审查（只读） |
| `e2e-tester` | 视觉测试 | 打开浏览器截图、点击、填表单、像真人一样测试 |

---

## 场景一：开发一个完整功能（推荐流程）

**例子：做一个用户资料管理页面**

### Step 1: 以 planner 身份启动 Claude Code

```bash
claude --agent planner
```

### Step 2: 告诉它你要做什么

```
帮我做一个用户资料管理页面，租户登录后可以查看和编辑自己的个人信息
```

### Step 3: Planner 会自动执行以下流程

1. 分析需求，写出 PLAN.md
2. 自动调用 `backend` → 创建 API 路由、Prisma 查询、Zod 验证
3. 自动调用 `auth-infra` → 确保路由有登录保护
4. 自动调用 `frontend` → 开发页面 UI 和表单
5. 自动调用 `qa` → 跑 tsc + build 验证
6. 自动调用 `e2e-tester` → 打开浏览器截图测试页面
7. 全部完成后，Stop Hook 自动 commit + push 到 GitHub

**你只需要说一句话，然后等结果。**

---

## 场景二：只做一个小改动

**例子：调一下 property card 的样式**

不需要经过 planner，直接指定 Agent：

```bash
claude --agent frontend
```

```
把 property card 上加一个 available date 的显示，用 warm-500 颜色
```

Frontend Agent 干完后会自动调 `qa` 检查，然后 auto-push。

---

## 场景三：修 Bug

```bash
claude --agent backend
```

```
/api/applications POST 接口报 500 错误，applicantId 为 null，帮我排查修复
```

Backend Agent 会定位问题、修复代码、调 `qa` 验证。

---

## 场景四：视觉测试（Computer Use）

**例子：测试整个租赁申请流程**

确保开发服务器正在运行：

```bash
# 先在另一个终端启动
cd ~/YellowRiver && npm run dev
```

然后启动 e2e-tester：

```bash
claude --agent e2e-tester
```

```
打开 localhost:3000，完整测试一遍租赁申请流程：
从首页到 listings，选一个房源，点 Apply Now，填完所有步骤，提交。
每步截图，检查有没有 JS 错误和 API 错误。
```

E2E Tester 会真的打开 Chrome 浏览器，一步步操作，截图验证每个页面。

**也可以录制 GIF：**

```
测试首页到申请的完整流程，录制成 GIF 保存下来
```

**测试移动端：**

```
把浏览器 resize 到 375x812，测试移动端的首页和 listings 页面
```

---

## 场景五：纯检查不改代码

```bash
claude --agent qa
```

```
全面检查一下项目，跑 tsc 和 build，看有没有问题
```

QA Agent 是只读的，只会输出问题报告，不会改你的代码。
QA 还可以自动调用 `e2e-tester` 做浏览器视觉测试。

---

## 场景六：在普通会话中按需调用

```bash
claude
```

进入普通会话后，用 `@` 调用特定 Agent：

```
@planner 规划一下接下来要做什么，看看 TO-DO.md

@backend 给 inquiries API 加上速率限制

@frontend 把 FAQ 页面加上搜索功能

@qa 检查最近的改动

@e2e-tester 打开浏览器测试一下首页和 listings 页面
```

---

## 自动 Push 机制

你不需要手动 git commit 和 push。每次 Agent 完成工作后：

1. 自动检测文件变更
2. 自动 `git add`（排除 .env 等敏感文件）
3. 自动生成描述性 commit message
4. 自动 `git push` 到当前分支

如果没有改动，就不会触发。

---

## 常用命令速查

### 启动

```bash
claude --agent planner          # 以规划者身份启动（大功能）
claude --agent frontend         # 以前端身份启动（UI 改动）
claude --agent backend          # 以后端身份启动（API 改动）
claude --agent qa               # 以 QA 身份启动（检查）
claude --agent e2e-tester       # 以视觉测试身份启动（浏览器测试）
claude                          # 普通模式，按需 @ 调用
```

### 会话中

```
/agents                         # 查看所有可用 Agent
/effort high                    # 开启深度思考
/compact                        # 压缩上下文（会话太长时用）
/rewind                         # 回退到之前的版本（改坏了用）
/memory                         # 查看和管理 Claude 的记忆
/cost                           # 查看本次会话的 token 消耗
/loop "跑 tsc --noEmit"         # 循环执行某个检查
```

### 快捷键

```
Esc Esc                         # 快速打开回退选择器
Shift+Tab                       # 切换权限模式
Ctrl+B                          # 后台运行当前任务
Ctrl+C                          # 取消/中断
Option+T (Mac)                  # 开关深度思考
```

### 高级用法

```bash
claude --agent planner --effort high    # 高级思考模式做规划
claude --worktree feature-auth          # 在隔离分支并行开发
claude --permission-mode plan           # 只分析不改代码
claude --continue                       # 继续上次的会话
```

---

## 推荐日常流程

### 每天开始

```bash
cd ~/YellowRiver
claude --agent planner
```

```
看看 TO-DO.md 和 PLAN.md，告诉我今天应该优先做什么
```

### 开发中

Planner 给出计划后，直接说：

```
开始执行吧
```

它会自动调度各 Agent 完成开发，每步完成后自动 push 到 GitHub。

### 结束前

```
@qa 做一次全面检查，确保一切正常
```

---

## 文件结构参考

```
.claude/
├── settings.json           # Hook 配置（auto-push）
├── settings.local.json     # 权限配置
├── hooks/
│   └── auto-push.sh        # 自动 commit + push 脚本
├── agents/
│   ├── planner.md          # 规划协调 Agent (Opus)
│   ├── frontend.md         # 前端 UI Agent (Opus)
│   ├── backend.md          # 后端 API Agent (Opus)
│   ├── auth-infra.md       # 认证基础设施 Agent (Opus)
│   ├── qa.md               # 质量保障 Agent (Opus)
│   └── e2e-tester.md       # 视觉测试 Agent (Opus, Computer Use)
└── USAGE-GUIDE.md          # 本文件
```
