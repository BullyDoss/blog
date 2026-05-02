<template>
  <div class="post-detail">
    <div v-if="loading" class="loading-state">
      <span class="loading-spinner"></span>
      <p>加载文章中...</p>
    </div>

    <div v-else-if="post">
      <article class="post-content">
        <header class="post-header">
          <h1 class="post-title">{{ post.title }}</h1>
          <div class="post-meta">
            <span class="meta-date">
              {{ new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </span>
          </div>
        </header>

        <div class="post-body" v-html="renderedContent"></div>
      </article>

      <section class="comments-section">
        <h2 class="comments-title">评论 ({{ comments.length }})</h2>

        <div v-if="comments.length > 0" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar">{{ comment.author.charAt(0).toUpperCase() }}</div>
            <div class="comment-body">
              <div class="comment-header">
                <strong class="comment-author">{{ comment.author }}</strong>
                <span class="comment-date">{{ new Date(comment.created_at).toLocaleString() }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
            </div>
          </div>
        </div>
        <div v-else class="no-comments">暂无评论，快来发表第一条评论吧</div>

        <form @submit.prevent="submitComment" class="comment-form">
          <h3>发表评论</h3>
          <div class="form-row">
            <div class="form-group">
              <input
                type="text"
                v-model="newComment.author"
                placeholder="你的昵称"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <textarea
              v-model="newComment.content"
              placeholder="写下你的想法..."
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" :disabled="submitting" class="submit-btn">
            {{ submitting ? '提交中...' : '发布评论' }}
          </button>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
        </form>
      </section>
    </div>

    <div v-else class="not-found">
      <h2>文章不存在</h2>
      <p>你访问的文章可能已被删除或地址有误。</p>
      <router-link to="/">返回首页</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';

export default {
  data() {
    return {
      post: null,
      loading: true,
      comments: [],
      newComment: {
        author: '',
        content: ''
      },
      submitting: false,
      errorMsg: '',
      successMsg: ''
    };
  },
  computed: {
    renderedContent() {
      if (!this.post || !this.post.content) return '';
      return marked(this.post.content);
    }
  },
  async mounted() {
    const slug = this.$route.params.slug;
    try {
      const postRes = await axios.get(`http://localhost:3000/api/posts/${slug}`);
      this.post = postRes.data;

      const commentsRes = await axios.get(`http://localhost:3000/api/posts/${this.post.id}/comments`);
      this.comments = commentsRes.data;
    } catch (err) {
      console.error('获取文章详情失败:', err);
      this.errorMsg = '加载文章失败，请稍后重试';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async submitComment() {
      if (!this.newComment.author.trim() || !this.newComment.content.trim()) {
        this.errorMsg = '请填写昵称和评论内容';
        return;
      }

      this.submitting = true;
      this.errorMsg = '';
      this.successMsg = '';

      try {
        await axios.post(`http://localhost:3000/api/posts/${this.post.id}/comments`, {
          author: this.newComment.author,
          content: this.newComment.content
        });

        this.successMsg = '评论成功';

        this.newComment.author = '';
        this.newComment.content = '';

        const res = await axios.get(`http://localhost:3000/api/posts/${this.post.id}/comments`);
        this.comments = res.data;

        setTimeout(() => {
          this.successMsg = '';
        }, 3000);
      } catch (err) {
        console.error('提交评论失败:', err);
        this.errorMsg = err.response?.data?.message || '提交评论失败，请稍后重试';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.post-detail {
  max-width: 780px;
  margin: 0 auto;
  padding: 40px 32px;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 2px solid #e8e8e8;
  border-top-color: #555;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.post-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.post-title {
  font-size: 32px;
  color: #111;
  line-height: 1.3;
  margin-bottom: 10px;
  font-weight: 700;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #999;
  font-size: 13px;
}

.post-body {
  line-height: 1.85;
  color: #333;
  font-size: 16px;
}

.post-body :deep(h1),
.post-body :deep(h2),
.post-body :deep(h3) {
  color: #111;
  margin: 28px 0 14px;
  font-weight: 700;
}

.post-body :deep(h2) {
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.post-body :deep(p) {
  margin: 0 0 16px;
}

.post-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 16px 0;
}

.post-body :deep(code) {
  background: #f5f5f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.9em;
  color: #333;
  border: 1px solid #eee;
}

.post-body :deep(pre) {
  background: #f7f7f7;
  padding: 18px;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.post-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
}

.post-body :deep(blockquote) {
  border-left: 3px solid #ccc;
  margin: 16px 0;
  padding: 6px 16px;
  color: #777;
  background: #fafafa;
  border-radius: 0 4px 4px 0;
}

.post-body :deep(a) {
  color: #111;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.comments-section {
  margin-top: 56px;
  padding-top: 36px;
  border-top: 1px solid #eee;
}

.comments-title {
  font-size: 20px;
  color: #111;
  margin-bottom: 20px;
  font-weight: 700;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #222;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author {
  color: #111;
  font-size: 13px;
}

.comment-date {
  color: #bbb;
  font-size: 11px;
}

.comment-content {
  margin: 0;
  line-height: 1.6;
  color: #555;
  font-size: 14px;
}

.no-comments {
  text-align: center;
  color: #bbb;
  padding: 40px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 28px;
  font-size: 14px;
}

.comment-form {
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #eee;
  margin-top: 28px;
}

.comment-form h3 {
  margin: 0 0 18px;
  color: #111;
  font-size: 16px;
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.form-group {
  flex: 1;
  margin-bottom: 10px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.2s;
  background: #fff;
  color: #333;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.04);
}

.submit-btn {
  background: #111;
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #333;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-msg {
  color: #d00;
  margin-top: 10px;
  font-size: 13px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
}

.success-msg {
  color: #16a34a;
  margin-top: 10px;
  font-size: 13px;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 6px;
}

.not-found {
  text-align: center;
  padding: 80px 20px;
}

.not-found h2 {
  color: #111;
  font-size: 24px;
  margin-bottom: 10px;
}

.not-found p {
  color: #999;
  margin-bottom: 18px;
}

.not-found a {
  color: #111;
  font-weight: 500;
}

@media (max-width: 768px) {
  .post-detail {
    padding: 20px 20px 40px;
  }

  .post-title {
    font-size: 24px;
  }

  .comment-item {
    flex-direction: column;
  }
}
</style>
