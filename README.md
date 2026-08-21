# 简道云用车审批 ChatUI

基于 Vercel AI Chatbot 模板改造的**企业用车审批聊天界面**。用户在对话中发起用车申请，后端对接简道云表单，实现车辆查询、预订与审批流转。

> 上游模板：[vercel/nextjs-ai-chatbot](https://github.com/vercel/nextjs-ai-chatbot)。本仓库在其基础上加入了车辆管理领域模型（vehicles / bookings / drivers）与 `/api/vehicles` 接口。

## 功能

- 💬 **对话式用车申请**：`app/(chat)` 页面通过 `useChat` 驱动 `VehicleChat` 组件
- 🚗 **车辆数据模型**：Drizzle ORM 定义 `vehicles`、`bookings`、`drivers` 表（`lib/db/schema.ts`）
- 🔌 **车辆 API**：`GET /api/vehicles?type=sedan&date=YYYY-MM-DD` 查询可用车辆，`POST /api/vehicles/book` 预订
- 🧪 **内置测试**：Playwright e2e（`pnpm test`）

## 快速开始

```bash
pnpm install
cp .env.example .env.local   # 填入 AUTH_SECRET / AI_GATEWAY_API_KEY / POSTGRES_URL 等
pnpm dev                     # http://localhost:3000
```

### 数据库

```bash
pnpm db:generate             # 生成迁移
pnpm db:migrate              # 执行迁移
pnpm db:studio               # 浏览数据
```

> 当前 `/api/vehicles` 在未配置数据库时回退到 mock 数据（见 `app/api/vehicles/route.ts`），便于本地先行体验。

## 脚本

```bash
pnpm build    # 生产构建
pnpm lint     # biome 检查
pnpm test     # Playwright e2e
```

## License

见 [LICENSE](LICENSE)。
