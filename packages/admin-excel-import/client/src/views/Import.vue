<template>
  <div class="import-page">
    <h1>📥 导入 Excel 数据</h1>
    <p class="desc">上传 Excel 或 CSV 文件，将数据导入到系统中</p>

    <div class="import-layout">
      <!-- 左侧：上传区域 -->
      <div class="panel">
        <div
          class="upload-zone"
          :class="{ dragging: isDragging, 'has-file': selectedFile }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileChange"
            style="display: none"
          />
          <div v-if="!selectedFile" class="upload-hint">
            <div class="upload-icon">📄</div>
            <p>点击选择或拖拽文件到此处</p>
            <p class="upload-tip">支持 .xlsx、.xls、.csv 格式，最大 10MB</p>
          </div>
          <div v-else class="file-info">
            <div class="file-icon">📊</div>
            <div>
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatSize(selectedFile.size) }}</p>
            </div>
            <button class="btn-clear" @click.stop="clearFile">✕</button>
          </div>
        </div>

        <!-- 导入选项 -->
        <div class="options" v-if="selectedFile">
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.clearExisting" />
            <span>清空已有数据</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.skipDuplicates" />
            <span>跳过重复数据</span>
          </label>
        </div>

        <!-- 操作按钮 -->
        <div class="actions" v-if="selectedFile">
          <button class="btn btn-secondary" @click="previewFile" :disabled="loading">
            预览数据
          </button>
          <button class="btn btn-primary" @click="importFile" :disabled="loading">
            {{ loading ? '导入中...' : '确认导入' }}
          </button>
        </div>

        <!-- 导入进度 -->
        <div class="progress" v-if="importResult">
          <div class="progress-header" :class="importResult.success ? 'success' : 'error'">
            {{ importResult.success ? '✅ 导入完成' : '❌ 导入失败' }}
          </div>
          <div class="progress-stats" v-if="importResult.data">
            <div class="stat">
              <span class="stat-num">{{ importResult.data.imported }}</span>
              <span class="stat-label">成功导入</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ importResult.data.skipped }}</span>
              <span class="stat-label">跳过</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ importResult.data.errors.length }}</span>
              <span class="stat-label">错误</span>
            </div>
          </div>
          <div class="error-list" v-if="importResult.data && importResult.data.errors.length">
            <p>错误详情：</p>
            <div class="error-item" v-for="(err, idx) in importResult.data.errors" :key="idx">
              第 {{ err.row }} 行: {{ err.error }}
            </div>
          </div>
        </div>

        <!-- 模板下载 -->
        <div class="template-section">
          <p>没有 Excel 文件？先下载模板：</p>
          <button class="btn btn-outline" @click="downloadTemplate">📥 下载导入模板</button>
        </div>
      </div>

      <!-- 右侧：预览表格 -->
      <div class="panel preview-panel" v-if="previewData">
        <h3>数据预览 <span class="preview-count">(共 {{ previewData.totalRows }} 行)</span></h3>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-index">#</th>
                <th v-for="header in previewData.headers" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewData.rows.slice(0, 100)" :key="idx">
                <td class="col-index">{{ idx + 1 }}</td>
                <td v-for="header in previewData.headers" :key="header">
                  {{ row[header] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="preview-tip" v-if="previewData.rows.length > 100">
          仅显示前 100 行，共 {{ previewData.rows.length }} 行
        </p>
      </div>
    </div>

    <!-- 导入结果预览 -->
    <div class="panel result-preview" v-if="importResult && importResult.data && importResult.data.preview">
      <h3>导入数据预览（前 5 行）</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="header in importResult.data.headers" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in importResult.data.preview" :key="idx">
              <td v-for="header in importResult.data.headers" :key="header">
                {{ row[header] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportView',
  data() {
    return {
      selectedFile: null,
      isDragging: false,
      loading: false,
      options: {
        clearExisting: false,
        skipDuplicates: true
      },
      previewData: null,
      importResult: null
    }
  },
  methods: {
    triggerFileInput() {
      if (!this.selectedFile) {
        this.$refs.fileInput.click()
      }
    },

    handleFileChange(e) {
      const file = e.target.files[0]
      if (file) this.setSelectedFile(file)
    },

    handleDrop(e) {
      this.isDragging = false
      const file = e.dataTransfer.files[0]
      if (file) this.setSelectedFile(file)
    },

    setSelectedFile(file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        alert('只支持 .xlsx、.xls、.csv 文件')
        return
      }
      this.selectedFile = file
      this.previewData = null
      this.importResult = null
    },

    clearFile() {
      this.selectedFile = null
      this.previewData = null
      this.importResult = null
      this.$refs.fileInput.value = ''
    },

    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },

    async previewFile() {
      if (!this.selectedFile) return
      this.loading = true

      try {
        const formData = new FormData()
        formData.append('file', this.selectedFile)

        const res = await fetch('/api/import/preview', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()

        if (json.success) {
          this.previewData = json.data
        } else {
          alert('预览失败: ' + json.error)
        }
      } catch (err) {
        alert('请求失败: ' + err.message)
      } finally {
        this.loading = false
      }
    },

    async importFile() {
      if (!this.selectedFile) return

      if (this.options.clearExisting) {
        if (!confirm('清空已有数据后无法恢复，确定要继续吗？')) return
      }

      this.loading = true
      this.importResult = null

      try {
        const formData = new FormData()
        formData.append('file', this.selectedFile)
        formData.append('clearExisting', this.options.clearExisting)
        formData.append('skipDuplicates', this.options.skipDuplicates)

        const res = await fetch('/api/import/excel', {
          method: 'POST',
          body: formData
        })
        const json = await res.json()

        this.importResult = json
      } catch (err) {
        this.importResult = { success: false, error: err.message }
      } finally {
        this.loading = false
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
    }
  }
}
</script>

<style scoped>
.import-page h1 { margin-bottom: 4px; }
.desc { color: #666; margin-bottom: 20px; }

.import-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.upload-zone:hover, .upload-zone.dragging {
  border-color: #4361ee;
  background: #f8f9ff;
}

.upload-zone.has-file {
  border-style: solid;
  border-color: #4361ee;
}

.upload-icon { font-size: 48px; margin-bottom: 12px; }
.upload-hint p { color: #666; margin-bottom: 4px; }
.upload-tip { font-size: 12px; color: #999 !important; }

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon { font-size: 32px; }
.file-name { font-weight: 500; }
.file-size { font-size: 13px; color: #999; }

.btn-clear {
  margin-left: auto;
  background: #ff4d4f;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
}

.options {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary { background: #4361ee; color: white; }
.btn-primary:hover { background: #3651d4; }
.btn-secondary { background: #e9ecef; color: #333; }
.btn-outline {
  background: white;
  border: 1px solid #4361ee;
  color: #4361ee;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.progress {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-header {
  padding: 12px 16px;
  font-weight: bold;
  color: white;
}
.progress-header.success { background: #52c41a; }
.progress-header.error { background: #ff4d4f; }

.progress-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #fafafa;
}

.stat { text-align: center; }
.stat-num { display: block; font-size: 24px; font-weight: bold; color: #4361ee; }
.stat-label { font-size: 13px; color: #999; }

.error-list {
  padding: 12px 16px;
  background: #fff2f0;
  border-top: 1px solid #ffccc7;
}

.error-item {
  font-size: 13px;
  color: #ff4d4f;
  padding: 2px 0;
}

.template-section {
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.template-section p { font-size: 14px; color: #666; margin-bottom: 8px; }

.preview-panel h3 { margin-bottom: 12px; }
.preview-count { font-weight: normal; color: #999; font-size: 14px; }

.table-wrapper {
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th, .data-table td {
  padding: 8px 12px;
  border: 1px solid #eee;
  text-align: left;
  white-space: nowrap;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.data-table tr:hover { background: #fafafa; }
.col-index { width: 40px; color: #999; }

.preview-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-top: 8px;
}

.result-preview {
  margin-top: 20px;
}
.result-preview h3 { margin-bottom: 12px; }
</style>
