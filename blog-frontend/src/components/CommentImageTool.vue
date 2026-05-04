<template>
  <div class="comment-image-tool">
    <div class="tool-header" @click="togglePanel">
      <span class="tool-title">📷 图片工具</span>
      <span class="toggle-icon">{{ isExpanded ? '▲' : '▼' }}</span>
    </div>

    <transition name="slide">
      <div v-if="isExpanded" class="tool-body">
        <!-- 上传区域 -->
        <div
          class="upload-zone"
          :class="{ 'drag-over': isDragOver, 'uploading': uploading }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            type="file"
            ref="fileInput"
            accept="image/jpeg,image/png,image/gif,image/webp"
            @change="handleFileSelect"
            hidden
          />

          <div v-if="!uploading && !uploadedImageUrl" class="upload-placeholder">
            <div class="upload-icon">📁</div>
            <p class="upload-text">点击或拖拽图片到这里</p>
            <p class="upload-hint">支持 JPG/PNG/GIF/WebP</p>
          </div>

          <div v-else-if="uploading" class="uploading-state">
            <div class="spinner"></div>
            <p>上传中...</p>
          </div>

          <div v-else class="upload-success">
            <img :src="uploadedImageUrl" :alt="'已上传图片'" class="preview-img" />
            <p class="success-text">✅ 上传成功！</p>
          </div>
        </div>

        <!-- 生成的 Markdown -->
        <div v-if="markdownImage" class="markdown-output">
          <label>Markdown 图片代码：</label>
          <div class="code-block">
            <code>{{ markdownImage }}</code>
            <button class="copy-btn" @click="copyToClipboard" :title="copied ? '已复制' : '复制'">
              {{ copied ? '✓' : '📋' }}
            </button>
          </div>
          <p class="usage-hint">
            💡 点击上方按钮复制，然后在下方评论框中 **Ctrl+V** 粘贴即可插入图片
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button v-if="uploadedImageUrl" @click="resetUpload" class="reset-btn">
            🔄 重新上传
          </button>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CommentImageTool',
  data() {
    return {
      isExpanded: false,
      isDragOver: false,
      uploading: false,
      uploadedImageUrl: '',
      markdownImage: '',
      errorMsg: '',
      copied: false,
    };
  },
  methods: {
    togglePanel() {
      this.isExpanded = !this.isExpanded;
    },

    triggerFileInput() {
      if (!this.uploading) {
        this.$refs.fileInput.click();
      }
    },

    handleDragOver() {
      this.isDragOver = true;
    },

    handleDragLeave() {
      this.isDragOver = false;
    },

    handleDrop(e) {
      this.isDragOver = false;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.uploadImage(file);
      } else {
        this.errorMsg = '请选择图片文件';
        setTimeout(() => { this.errorMsg = ''; }, 3000);
      }
    },

    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        this.uploadImage(file);
      }
    },

    async uploadImage(file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMsg = '图片大小不能超过 5MB';
        setTimeout(() => { this.errorMsg = ''; }, 3000);
        return;
      }

      this.uploading = true;
      this.errorMsg = '';
      this.uploadedImageUrl = '';
      this.markdownImage = '';

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await axios.post('http://localhost:3000/api/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        let imageUrl = res.data.url || res.data;

        if (!imageUrl.startsWith('http')) {
          imageUrl = `http://localhost:3000${imageUrl}`;
        }

        this.uploadedImageUrl = imageUrl;
        this.markdownImage = `![图片](${imageUrl})`;

        this.copied = false;
      } catch (err) {
        console.error('图片上传失败:', err);
        this.errorMsg = err.response?.data?.message || '上传失败，请重试';
        setTimeout(() => { this.errorMsg = ''; }, 5000);
      } finally {
        this.uploading = false;
      }
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.markdownImage);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        const textArea = document.createElement('textarea');
        textArea.value = this.markdownImage;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      }
    },

    resetUpload() {
      this.uploadedImageUrl = '';
      this.markdownImage = '';
      this.copied = false;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
  },
};
</script>

<style scoped>
.comment-image-tool {
  background: #f8f9fa;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  background: #fff;
}

.tool-header:hover {
  background: #f6f8fa;
}

.tool-title {
  font-size: 14px;
  font-weight: 600;
  color: #24292e;
}

.toggle-icon {
  font-size: 12px;
  color: #586069;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.tool-body {
  padding: 16px;
  border-top: 1px solid #e1e4e8;
}

.upload-zone {
  border: 2px dashed #d1d5da;
  border-radius: 6px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
  margin-bottom: 16px;
}

.upload-zone:hover {
  border-color: #0366d6;
  background: #f1f8ff;
}

.upload-zone.drag-over {
  border-color: #0366d6;
  background: #e6f2ff;
  transform: scale(1.02);
}

.upload-zone.uploading {
  pointer-events: none;
  opacity: 0.7;
}

.upload-placeholder .upload-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #586069;
  margin-bottom: 4px;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #959da5;
}

.uploading-state {
  color: #0366d6;
  font-size: 14px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e1e4e8;
  border-top-color: #0366d6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-success .preview-img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 6px;
  margin-bottom: 10px;
  object-fit: contain;
}

.success-text {
  color: #28a745;
  font-weight: 600;
  font-size: 14px;
}

.markdown-output {
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.markdown-output label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #24292e;
  margin-bottom: 8px;
}

.code-block {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 10px 12px;
}

.code-block code {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #24292e;
  word-break: break-all;
}

.copy-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background: #0366d6;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #0256c7;
}

.usage-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #586069;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.reset-btn {
  flex: 1;
  padding: 8px 16px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #24292e;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #e1e4e8;
}

.error-msg {
  margin-top: 12px;
  padding: 10px 12px;
  background: #ffeef0;
  border: 1px solid #ffccd0;
  border-radius: 4px;
  color: #cb2431;
  font-size: 13px;
}
</style>
