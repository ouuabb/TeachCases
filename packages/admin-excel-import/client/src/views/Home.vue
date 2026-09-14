<template>
  <div class="home">
    <section class="hero">
      <h1>Excel 导入导出教学项目</h1>
      <p class="subtitle">掌握前后端 Excel 文件处理的完整流程</p>
    </section>

    <section class="cards">
      <router-link to="/import" class="card">
        <div class="card-icon">📥</div>
        <h3>导入数据</h3>
        <p>上传 Excel 文件，解析数据并存入后端。支持预览、数据校验、重复检测。</p>
        <span class="card-link">开始导入 →</span>
      </router-link>

      <router-link to="/export" class="card">
        <div class="card-icon">📤</div>
        <h3>导出数据</h3>
        <p>将后端数据导出为 Excel 文件下载。支持搜索筛选、自动列宽、模板下载。</p>
        <span class="card-link">去导出 →</span>
      </router-link>
    </section>

    <section class="concepts">
      <h2>核心概念</h2>
      <div class="concept-grid">
        <div class="concept-item">
          <h4>SheetJS (xlsx) 是什么？</h4>
          <p>
            SheetJS 是最流行的 JavaScript Excel 处理库。
            它可以在前端和后端通用，支持读取、写入、解析 .xlsx/.xls/.csv 格式。
            本项目前后端都使用它。
          </p>
        </div>
        <div class="concept-item">
          <h4>导入流程</h4>
          <p>
            用户选择文件 → 前端预览确认 → 上传到后端 → 后端解析 Excel →
            数据校验清洗 → 存入数据库 → 返回导入结果
          </p>
        </div>
        <div class="concept-item">
          <h4>导出流程</h4>
          <p>
            前端发起请求 → 后端查询数据 → 将 JSON 转为 Excel →
            设置响应头触发下载 → 浏览器保存文件
          </p>
        </div>
      </div>
    </section>

    <section class="tech-stack">
      <h2>技术栈</h2>
      <div class="stack-list">
        <div class="stack-item">
          <strong>前端</strong>
          <span>Vue 3 + xlsx (客户端解析 Excel) + Fetch API</span>
        </div>
        <div class="stack-item">
          <strong>后端</strong>
          <span>Express + xlsx (服务端生成 Excel) + multer (文件上传)</span>
        </div>
        <div class="stack-item">
          <strong>存储</strong>
          <span>JSON 文件 (教学简化，生产替换为数据库)</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  text-align: center;
  padding: 48px 0 32px;
}
.hero h1 { font-size: 32px; color: #1a1a2e; margin-bottom: 8px; }
.subtitle { color: #666; font-size: 16px; }

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-4px); }
.card-icon { font-size: 40px; margin-bottom: 12px; }
.card h3 { margin-bottom: 8px; color: #1a1a2e; }
.card p { color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
.card-link { color: #4361ee; font-weight: 500; font-size: 14px; }

.concepts h2, .tech-stack h2 { font-size: 22px; margin-bottom: 16px; color: #1a1a2e; }

.concept-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.concept-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #4361ee;
}
.concept-item h4 { margin-bottom: 8px; color: #1a1a2e; }
.concept-item p { color: #666; font-size: 14px; line-height: 1.6; }

.stack-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stack-item {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
}
.stack-item strong {
  min-width: 60px;
  color: #4361ee;
}
.stack-item span { color: #666; font-size: 14px; }
</style>
