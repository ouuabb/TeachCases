<template>
  <div class="export-page">
    <h1>📤 导出数据</h1>
    <p class="desc">将系统数据导出为 Excel 文件下载</p>

    <div class="panel">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="keyword"
            placeholder="搜索任意字段..."
            @keyup.enter="loadData"
          />
          <button class="btn btn-primary" @click="loadData">搜索</button>
          <button class="btn btn-secondary" @click="clearSearch">清空</button>
        </div>
        <div class="export-actions">
          <button class="btn btn-success" @click="exportExcel" :disabled="total === 0">
            📥 导出 Excel
          </button>
          <button class="btn btn-outline" @click="downloadTemplate">
            📄 下载模板
          </button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-wrapper">
        <table class="data-table" v-if="records.length">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th v-for="header in headers" :key="header">{{ header }}</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td class="col-id">{{ record.id }}</td>
              <td v-for="header in headers" :key="header">
                {{ record[header] || '-' }}
              </td>
              <td class="col-action">
                <button class="btn-delete" @click="deleteRecord(record.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无数据</p>
          <p class="empty-hint">请先在「导入数据」页面导入 Excel 文件</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <span class="page-info">
          共 {{ total }} 条，第 {{ page }} / {{ totalPages }} 页
        </span>
        <div class="page-buttons">
          <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
        </div>
      </div>
    </div>

    <!-- 导出说明 -->
    <div class="panel info-panel">
      <h3>导出功能说明</h3>
      <ul>
        <li><strong>自动列宽</strong>：导出的 Excel 会根据内容自动调整列宽</li>
        <li><strong>搜索导出</strong>：可以先搜索筛选，再导出符合条件的数据</li>
        <li><strong>实时数据</strong>：导出的是后端 JSON 存储中的最新数据</li>
        <li><strong>模板下载</strong>：提供标准格式的空白模板供填写后导入</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExportView',
  data() {
    return {
      records: [],
      headers: [],
      keyword: '',
      page: 1,
      pageSize: 20,
      total: 0
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const params = new URLSearchParams({
          page: this.page,
          pageSize: this.pageSize,
          keyword: this.keyword
        })
        const res = await fetch(`/api/data?${params}`)
        const json = await res.json()

        if (json.success) {
          this.records = json.data.list
          this.total = json.data.total

          // 动态获取表头（排除 id）
          if (this.records.length > 0) {
            this.headers = Object.keys(this.records[0]).filter(k => k !== 'id')
          }
        }
      } catch (err) {
        console.error('加载数据失败:', err)
      }
    },

    clearSearch() {
      this.keyword = ''
      this.page = 1
      this.loadData()
    },

    goPage(p) {
      this.page = p
      this.loadData()
    },

    async exportExcel() {
      try {
        const params = this.keyword ? `?keyword=${encodeURIComponent(this.keyword)}` : ''
        const res = await fetch(`/api/export/excel${params}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data_export_${new Date().toISOString().slice(0, 10)}.xlsx`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        alert('导出失败: ' + err.message)
      }
    },

    async downloadTemplate() {
      try {
        const res = await fetch('/api/export/template')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'import_template.xlsx'
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        alert('下载失败: ' + err.message)
      }
    },

    async deleteRecord(id) {
      if (!confirm('确定要删除这条记录吗？')) return

      try {
        await fetch(`/api/data/${id}`, { method: 'DELETE' })
        this.loadData()
      } catch (err) {
        alert('删除失败: ' + err.message)
      }
    }
  }
}
</script>

<style scoped>
.export-page h1 { margin-bottom: 4px; }
.desc { color: #666; margin-bottom: 20px; }

.panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 240px;
}

.export-actions { display: flex; gap: 8px; }

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary { background: #4361ee; color: white; }
.btn-secondary { background: #e9ecef; color: #333; }
.btn-success { background: #52c41a; color: white; }
.btn-outline { background: white; border: 1px solid #4361ee; color: #4361ee; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 6px 12px; font-size: 13px; }

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 12px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th, .data-table td {
  padding: 10px 12px;
  border: 1px solid #eee;
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.data-table tr:hover { background: #fafafa; }
.col-id { width: 60px; color: #999; }
.col-action { width: 80px; }

.btn-delete {
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete:hover { background: #ff4d4f; color: white; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-hint { font-size: 13px; color: #ccc; margin-top: 4px; }

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.page-info { font-size: 13px; color: #999; }
.page-buttons { display: flex; gap: 8px; }

.info-panel h3 { margin-bottom: 12px; font-size: 16px; }
.info-panel ul { padding-left: 20px; }
.info-panel li {
  color: #666;
  font-size: 14px;
  line-height: 2;
}
</style>
