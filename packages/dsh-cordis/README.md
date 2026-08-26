# dsh-cordis —— DSH vendored Cordis 源码教学

对照 deepseek-harness 仓库 `vendor/cordis/src/` 的 9 个源码文件，逐一编写教学文档，并配套可直接运行的演示代码。

## 这是什么

deepseek-harness（DSH）没有通过 npm 依赖 Cordis，而是把上游 cordiverse/cordis `packages/core`（v4.0.0-rc.7，commit `56b3d4f`）连同 cosmokit、loader、hmr 等一起 **vendor 进仓库**，重命名为 `@deepseek-ai/*` 并做了若干本地增强（fiber 生命周期加固、懒配置求值等）。本教学目录：

- `vendor/` —— 从 DSH 抓取的原始源码快照（**只读参考**，一字未改）
- `docs/` —— 逐文件教学文档，所有结论都标注源码行号
- `code/` —— 每篇文档对应的可运行示例，直接 import vendored 源码

## 目录地图

```
dsh-cordis/
├── vendor/
│   ├── cordis/src/        # 9 个核心文件（教学主体）
│   │   ├── utils.ts       # 底层工具：DisposableList / symbols / traceable 代理 / 长栈
│   │   ├── context.ts     # Context：Proxy 容器 + extend/isolate/intercept
│   │   ├── service.ts     # Service 抽象基类
│   │   ├── fiber.ts       # Fiber：插件生命周期状态机 + effect 系统
│   │   ├── events.ts      # EventsService：五种分发模式的事件总线
│   │   ├── reflect.ts     # ReflectService：服务反射层（Proxy 陷阱 / provide / mixin）
│   │   ├── registry.ts    # RegistryService：插件注册表与依赖注入
│   │   ├── logger.ts      # LoggerService：日志门面 / 导出器 / 格式化
│   │   └── index.ts       # 导出聚合
│   └── cosmokit/src/      # 基础工具库（cordis 的唯一运行时依赖）
├── docs/
│   ├── 00-overview.md        # 架构总览：五大内部服务与启动流程
│   ├── 01-utils.md           # 底层工具：符号表 / 可逆列表 / traceable 代理 / 长栈
│   ├── 02-context.md         # Context：Proxy 容器 + extend/isolate/intercept
│   ├── 03-fiber.md           # Fiber：生命周期状态机 + effect + epoch 重载
│   ├── 04-events.md          # 事件总线：五种分发模式与内部事件
│   ├── 05-reflect.md         # 服务反射层：Proxy 陷阱 / provide / mixin
│   ├── 06-registry.md        # 插件注册表：三种形态 / inject / @Inject
│   ├── 07-service.md         # Service 基类：可调用服务 / intercept 配置
│   ├── 08-logger.md          # 日志：门面 / 导出器 / 级别过滤 / 格式化
│   └── 09-comprehensive.md   # index 导出全景 + mini-agent 综合实战
└── code/
    ├── 00-bootstrap.demo.ts
    └── ……                    # 与 docs 编号一一对应
```

## 学习路线

建议按编号顺序阅读，难度递进：

```
00 总览          全局架构图、一次 new Context() 发生了什么
─────────────────────────────────────────────
基础层（无业务语义的纯机制）
01 utils         符号表、可逆列表、traceable 代理、长栈拼接
02 context       为什么 ctx 是 Proxy；extend/isolate/intercept 三兄弟
─────────────────────────────────────────────
核心层（框架的心脏）
03 fiber         状态机、effect、epoch 响应式重载（最重要的一章）
04 events        emit/parallel/serial/bail/waterfall 与内部事件
─────────────────────────────────────────────
服务层（对外能力）
05 reflect       ctx.foo 的解析全过程；provide/accessor/mixin
06 registry      插件三种形态、inject 声明、@Inject 装饰器
07 service       自定义服务的正确姿势；可调用服务；intercept 配置
08 logger        日志门面、导出器、级别过滤
─────────────────────────────────────────────
09 comprehensive  导出面全景 + 一个 mini-agent 综合案例
```

## 运行示例

```bash
# 在本目录（packages/dsh-cordis）下
pnpm install            # 已装过可跳过
pnpm demo               # 依次运行全部示例
pnpm exec tsx code/03-fiber.demo.ts   # 单独运行某一章
```

要求 Node >= 20。示例通过 `tsx` 直接运行 TypeScript 源码，无需构建；
cosmokit 以 `file:` 依赖指向 `vendor/cosmokit`，完全离线可跑。

## 约定

- 文档中 `fiber.ts:418` 表示 `vendor/cordis/src/fiber.ts` 第 418 行
- 示例输出中的分隔行对应文档的小节标题，建议边跑边对照
- `internal/*` 事件是框架内部约定，插件作者一般只用它做深度集成
