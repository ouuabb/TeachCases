# Excel 导入导出教学项目

一个完整的 Excel 数据导入导出教学案例，涵盖前端文件解析、后端数据处理、模板下载、数据校验等核心功能。

## 项目结构

```
admin-excel-import/
├── package.json
├── README.md
├── docs/
│   └── concepts.md           # 教学文档
├── server/
│   ├── index.js              # Express 服务入口
│   ├── storage.js            # JSON 文件存储
│   ├── data/                 # 数据存储目录
│   └── routes/
│       ├── import.js         # POST /api/import/excel
│       ├── export.js         # GET /api/export/excel, /api/export/template
│       └── data.js           # GET/DELETE /api/data
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/index.js
        ├── utils/            # 工具函数（预留）
        └── views/
            ├── Home.vue      # 首页：概念讲解
            ├── Import.vue    # 导入页面：上传、预览、导入
            └── Export.vue    # 导出页面：查看、搜索、下载
```

## 快速开始

```bash
cd packages/admin-excel-import
npm install
npm run dev

# 或分别启动
npm run dev:server   # http://localhost:3000
npm run dev:client   # http://localhost:3001
```

## 页面说明

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/` | Excel 处理概念介绍 |
| 导入 | `/import` | 上传 Excel、预览数据、导入系统 |
| 导出 | `/export` | 查看数据、搜索筛选、下载 Excel |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/import/excel` | 上传 Excel 并导入 |
| POST | `/api/import/preview` | 预览 Excel（不导入） |
| GET | `/api/export/excel` | 导出数据为 Excel |
| GET | `/api/export/template` | 下载导入模板 |
| GET | `/api/data` | 查询数据列表 |
| DELETE | `/api/data/:id` | 删除单条数据 |

## 教学重点

1. **SheetJS 使用**：前后端通用的 Excel 解析与生成
2. **文件上传**：FormData + multer 处理 multipart 上传
3. **数据流**：文件 → 解析 → 校验 → 存储 → 查询 → 导出
4. **前端预览**：浏览器端解析 Excel 实现预览
5. **下载机制**：Blob + URL.createObjectURL 实现文件下载

详细文档：[docs/concepts.md](./docs/concepts.md)
