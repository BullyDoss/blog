<template>
  <div class="submit-page">
    <div class="submit-card">
      <h1 class="submit-title">我要投稿</h1>
      <p class="submit-desc">分享你的想法、经验或故事，我们会审核后发布</p>

      <form @submit.prevent="handleSubmit" class="submit-form">
        <div class="form-group">
          <label>标题</label>
          <input type="text" v-model="form.title" placeholder="请输入标题" required />
        </div>

        <div class="form-group">
          <label>昵称</label>
          <input type="text" v-model="form.author" placeholder="你的昵称" required />
        </div>

        <div class="form-group">
          <label>正文内容</label>
          <textarea v-model="form.content" placeholder="写下你想分享的内容..." rows="10" required></textarea>
        </div>

        <button type="submit" :disabled="submitting" class="submit-btn">
          {{ submitting ? '提交中...' : '提交投稿' }}
        </button>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SubmitView',
  data() {
    return {
      form: { title: '', author: '', content: '' },
      submitting: false,
      errorMsg: '',
      successMsg: ''
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.form.title || !this.form.author || !this.form.content) {
        this.errorMsg = '请填写所有字段'
        return
      }
      this.submitting = true
      this.errorMsg = ''
      this.successMsg = ''
      try {
        const slug = 'submit-' + Date.now()
        await axios.post('http://localhost:3000/api/submit', {
          title: this.form.title,
          author: this.form.author,
          content: this.form.content,
          slug: slug,
          category: 'submit'
        })
        this.successMsg = '投稿成功！感谢你的分享，我们会尽快审核发布'
        this.form = { title: '', author: '', content: '' }
        setTimeout(() => { this.successMsg = '' }, 5000)
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '提交失败，请稍后重试'
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.submit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: calc(100vh - 130px);
}

.submit-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 36px 32px;
}

.submit-title {
  font-size: 26px;
  color: #111;
  font-weight: 700;
  margin-bottom: 6px;
}

.submit-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 28px;
}

.submit-form .form-group {
  margin-bottom: 18px;
}

.submit-form label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-weight: 500;
  font-size: 13px;
}

.submit-form input,
.submit-form textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color .15s;
  background: #fff;
  color: #333;
  resize: vertical;
}

.submit-form input:focus,
.submit-form textarea:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 0 2px rgba(0,0,0,.04);
}

.submit-btn {
  width: 100%;
  padding: 13px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  margin-top: 8px;
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) { background: #333; }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }

.error-msg {
  margin-top: 14px;
  font-size: 13px;
  padding: 10px 14px;
  color: #555;
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 5px;
}

.success-msg {
  margin-top: 14px;
  font-size: 13px;
  padding: 10px 14px;
  color: #555;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 5px;
}
</style>
