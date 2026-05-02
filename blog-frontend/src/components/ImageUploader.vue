<template>
  <div class="image-uploader">
    <div v-if="images.length > 0" class="image-preview-list">
      <div v-for="(img, index) in images" :key="index" class="preview-item">
        <img :src="getFullUrl(img)" :alt="'图片' + (index + 1)" />
        <button type="button" class="remove-btn" @click.prevent="removeImage(index)">x</button>
      </div>
    </div>

    <label class="upload-btn">
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        @change="handleFileSelect"
        ref="fileInput"
        hidden
      />
      <span>添加图片</span>
    </label>

    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ImageUploader',
  props: {
    modelValue: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      uploading: false,
      errorMsg: '',
    };
  },
  computed: {
    images() {
      return this.modelValue || [];
    },
  },
  methods: {
    getFullUrl(url) {
      if (!url) return '';
      return url.startsWith('http') ? url : `http://localhost:3000${url}`;
    },

    async handleFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      this.errorMsg = '';
      this.uploading = true;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await axios.post('http://localhost:3000/api/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        });

        const newImages = [...this.images, res.data.url];
        this.$emit('update:modelValue', newImages);
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '上传失败';
      } finally {
        this.uploading = false;
        e.target.value = '';
      }
    },

    removeImage(index) {
      const newImages = [...this.images];
      newImages.splice(index, 1);
      this.$emit('update:modelValue', newImages);
    },
  },
};
</script>

<style scoped>
.image-uploader {
  margin-bottom: 16px;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-item {
  position: relative;
  width: 120px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.preview-item:hover .remove-btn {
  opacity: 1;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border: 1px dashed #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-btn span {
  font-size: 13px;
  color: #888;
}

.upload-btn:hover {
  border-color: #999;
  background: #f5f5f5;
}

.upload-btn:hover span {
  color: #555;
}

.error {
  color: #d00;
  font-size: 12px;
  margin-top: 8px;
}
</style>
