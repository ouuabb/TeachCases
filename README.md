# 教学案例 Monorepo

> 使用 Turborepo 统一管理每个教学项目

## 项目列表

| 包名 | 说明 | 技术栈 |
|------|------|--------|
| `scanjump-app` | 扫码跳 App 路由（6 种 DeepLink 方案） | uni-app + Express |

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 启动所有项目
pnpm dev

# 启动指定项目
pnpm --filter scanjump-app dev
```

### 构建

```bash
pnpm build
```

## 目录结构

```
TeachCases/
├── package.json              # 根配置
├── pnpm-workspace.yaml       # 工作区配置
├── turbo.json                # Turborepo 任务配置
├── packages/
│   └── scanjump-app/         # 扫码跳 App 路由教学案例
│       ├── pages/            # 页面
│       ├── server/           # 后端服务
│       ├── core/             # 核心逻辑
│       ├── utils/            # 工具函数
│       └── docs/             # 教学文档
└── README.md
```

## 添加新教学案例

1. 在 `packages/` 下创建新目录
2. 添加 `package.json`（name 以 `teach-` 或自定义前缀命名）
3. 在根目录 `pnpm install` 自动链接

## 技术栈

- **包管理**：pnpm workspaces
- **构建编排**：Turborepo
- **前端框架**：uni-app (Vue 3)
- **后端**：Express.js
