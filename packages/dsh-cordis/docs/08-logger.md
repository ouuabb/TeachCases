# 08 · logger.ts —— 日志门面与导出器

> 源码：`vendor/cordis/src/logger.ts`（270 行）
> 对应示例：`code/08-logger.demo.ts`

核心是"**门面-导出器**"模型：`ctx.logger(name)` 得到命名门面，
门面把结构化 `Message` 交给注册的 exporters；框架核心零 I/O，
真正输出由导出器插件承担。

## 1. 基础类型（L13-49）

- `LoggerType = 'error'|'info'|'warn'|'debug'`；`LoggerLevel` const enum
  ERROR=0 / INFO=1 / WARN=2 / DEBUG=3
- `Message`：`{ sn, ts, name, type, level, args, fiber?: WeakRef }`
- `Exporter`：`{ colors?, maxLength?, levels?, formatters?, export(msg) }`
  - `levels`：按 logger 名设定阈值（`levels['xxx']` / `levels.default`）
  - `formatters`：覆盖/扩展占位符

## 2. 格式化（L99-131）

流程：`args[0]` 是 Error → 取 stack + 前置 `%s`；非字符串 → 前置 `%o`；
`%%` 转义；逐占位符替换；剩余对象参数按空格拼接；`maxLength` 截断（默认 10240）。

内建占位符（L50-61）：`%s` String / `%d %i` 取整 / `%f` Number / `%o %O`
JSON / `%c` 空串 / `%C` 按 logger 名着色（`Logger.color`）。

名字着色靠 `Logger.code`（L89-97）：对名字做哈希 → 落到 `c16`/`c256`
调色板下标（L165-173）。

## 3. 级别过滤（L141-161）

`_method` 对每个 exporter：

```ts
targetLevel = exporter.levels?.[name] ?? exporter.levels?.default
              ?? this.level ?? LoggerLevel.INFO
if (targetLevel < level) continue        // 低于阈值跳过
```

另外 Error 参数会展开 `cause` / `AggregateError.errors` 为多条（L143-149）。

## 4. 可调用服务 `ctx.logger`（L184-269）

- `LoggerService` 构造用 `createCallable`（L208）变成函数：
  `ctx.logger('name')` 创建命名门面
- `[symbols.invoke](name?)`（L251-261）：名字缺省时
  `config.name ?? hyphenate(fiber.name)`——**缺省名来自所在 fiber 的插件名**
- 构造时内置一个 buffer exporter（L213-221）：环形缓冲，`bufferSize=1000`
- `exporter()` 注册随当前 fiber 卸载自动移除（L232-237）
- prototype 上的四个级别方法直接走 `this()()[type]`（L263-269）

`LoggerService.Intercept = { name?, level? }`（L176-181）——
通过 `ctx.intercept('logger', {...})` 给子树设置缺省名/级别。

## 示例演示什么

`code/08-logger.demo.ts`：自定义 exporter 抓 Message；级别过滤；
占位符与 Error/AggregateError 展开；缺省名 vs 显式名；exporter 随
fiber 卸载移除；intercept 改变子树日志名。
