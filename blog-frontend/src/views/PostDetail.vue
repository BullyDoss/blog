<template>
  <div class="channel-home">
    <div v-if="loading" class="empty-state">加载中...</div>

    <template v-else>
      <!-- 文章列表：未选中文章时显示该频道所有文章 -->
      <div v-if="!selectedPost" class="post-list">
        <h1 class="list-title">{{ channelConfig.title }}</h1>
        <p class="list-desc">{{ channelConfig.desc }}</p>

        <div v-if="channelPosts.length === 0" class="empty-list">
          还没有内容，快去后台发布吧
        </div>

        <div v-else class="list-items">
          <router-link
            v-for="post in channelPosts"
            :key="post.id"
            :to="'/' + channelKey + '/' + post.slug"
            class="list-item"
          >
            <div class="item-main">
              <h3 class="item-title">{{ post.title }}</h3>
              <p v-if="post.excerpt" class="item-excerpt">{{ post.excerpt }}</p>
            </div>
            <span class="item-date">{{ formatDate(post.created_at) }}</span>
          </router-link>
        </div>
      </div>

      <!-- 文章详情 -->
      <article v-else class="post-detail">
        <header class="post-header">
          <h1 class="post-title">{{ selectedPost.title }}</h1>
          <div class="post-meta">
            <span>{{ new Date(selectedPost.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
          </div>
        </header>

        <!-- 图片展示（chat 频道优先） -->
        <div v-if="images.length > 0" class="post-images">
          <img
            v-for="img in images"
            :key="img.id"
            :src="getFullUrl(img.url)"
            :alt="selectedPost.title"
            class="post-image"
          />
        </div>

        <!-- 正文 -->
        <div class="post-body" v-html="renderedContent"></div>

        <!-- 评论 -->
        <section class="comments-section">
          <h2>评论 ({{ comments.length }})</h2>

          <div v-if="comments.length > 0" class="comments-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">{{ c.author.charAt(0).toUpperCase() }}</div>
              <div class="comment-body">
                <div class="comment-header">
                  <strong>{{ c.author }}</strong>
                  <span>{{ new Date(c.created_at).toLocaleString() }}</span>
                </div>
                <p>{{ c.content }}</p>
              </div>
            </div>
          </div>
          <div v-else class="no-comments">暂无评论</div>

          <form @submit.prevent="submitComment" class="comment-form">
            <input type="text" v-model="newComment.author" placeholder="昵称" required />
            <textarea v-model="newComment.content" placeholder="写下你的想法..." rows="3" required></textarea>
            <button type="submit" :disabled="submitting">{{ submitting ? '提交中...' : '发布' }}</button>
            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
            <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
          </form>
        </section>
      </article>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';
import { api, imgUrl } from '@/utils/api.js';

export default {
  name: 'PostDetail',
  props: {
    channelKey: { type: String, required: true },
    channelConfig: { type: Object, required: true },
  },
  data() {
    return {
      posts: [],
      selectedPost: null,
      images: [],
      comments: [],
      loading: false,
      newComment: { author: '', content: '' },
      submitting: false,
      errorMsg: '',
      successMsg: '',
    };
  },
  computed: {
    renderedContent() {
      if (!this.selectedPost || !this.selectedPost.content) return '';
      return marked(this.selectedPost.content);
    },
    currentSlug() { return this.$route.params.slug; },
    channelPosts() {
      return this.posts.filter(p => (p.category || 'notes') === this.channelKey);
    },
  },
  watch: {
    '$route.params.slug': {
      immediate: true,
      handler(slug) {
        if (slug) this.loadPost(slug);
        else this.selectedPost = null;
      }
    },
  },
  methods: {
    getFullUrl(url) {
      if (!url) return '';
      return imgUrl(url);
    },

    formatDate(d) {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = (dt.getMonth() + 1).toString().padStart(2, '0');
      const day = dt.getDate().toString().padStart(2, '0');
      return y + '/' + m + '/' + day;
    },

    async loadList() {
      try {
        const res = await axios.get(api('/api/posts'), {
          params: { category: this.channelKey }, timeout: 8000
        });
        this.posts = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('获取列表失败:', err.message);
      }
    },

    async loadPost(slug) {
      this.loading = true;
      this.errorMsg = '';
      try {
        const postRes = await axios.get(api(`/api/posts/${slug}`));
        this.selectedPost = postRes.data;

        const [imgRes, commentRes] = await Promise.all([
          axios.get(api(`/api/posts/${this.selectedPost.id}/images`)),
          axios.get(api(`/api/posts/${this.selectedPost.id}/comments`)),
        ]);
        this.images = imgRes.data;
        this.comments = commentRes.data;
      } catch (err) {
        console.error('加载文章失败:', err);
        this.errorMsg = '加载失败';
      } finally {
        this.loading = false;
      }
    },

    async submitComment() {
      if (!this.newComment.author.trim() || !this.newComment.content.trim()) {
        this.errorMsg = '请填写完整'; return;
      }
      this.submitting = true; this.errorMsg = ''; this.successMsg = '';
      try {
        await axios.post(api(`/api/posts/${this.selectedPost.id}/comments`), {
          author: this.newComment.author, content: this.newComment.content
        });
        this.successMsg = '评论成功';
        this.newComment = { author: '', content: '' };
        const res = await axios.get(api(`/api/posts/${this.selectedPost.id}/comments`));
        this.comments = res.data;
        setTimeout(() => { this.successMsg = ''; }, 3000);
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '失败';
      } finally { this.submitting = false; }
    },
  },
  mounted() {
    this.loadList();
    if (this.currentSlug) { this.loadPost(this.currentSlug); }
    else { this.loading = false; }
  },
};
</script>

<style scoped>
.channel-home { max-width: 780px; margin: 0 auto; padding: 32px 24px; min-height: calc(100vh - 130px); }

.empty-state { text-align: center; padding: 80px 20px; color: #bbb; }

/* ===== 文章列表 ===== */
.post-list { animation: fadeIn .2s ease; }
.list-title { font-size: 26px; color: #111; margin-bottom: 6px; font-weight: 700; }
.list-desc { font-size: 14px; color: #999; margin-bottom: 28px; }
.empty-list { text-align: center; padding: 60px 20px; color: #bbb; font-size: 15px; }

.list-items { display: flex; flex-direction: column; gap: 0; }
.list-item {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 16px; padding: 18px 0;
  border-bottom: 1px solid #f0f0f0;
  text-decoration: none; color: inherit;
  transition: background .1s;
}
.list-item:hover { background: #fafafa; margin: 0 -12px; padding: 18px 12px; border-radius: 6px; border-bottom-color: transparent; }
.item-main { flex: 1; min-width: 0; }
.item-title {
  font-size: 16px; font-weight: 600; color: #222;
  line-height: 1.4; margin-bottom: 4px;
}
.list-item:hover .item-title { color: #000; }
.item-excerpt {
  font-size: 13px; color: #aaa; line-height: 1.5;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 520px;
}
.item-date { font-size: 12px; color: #bbb; flex-shrink: 0; }

.post-detail { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.post-header { margin-bottom: 28px; padding-bottom: 18px; border-bottom: 1px solid #eee; }
.post-title { font-size: 30px; color: #111; line-height: 1.3; margin-bottom: 8px; font-weight: 700; }
.post-meta { display: flex; align-items: center; gap: 10px; color: #999; font-size: 13px; }

.post-images { margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
.post-image { width: 100%; max-height: 500px; object-fit: cover; border-radius: 6px; border: 1px solid #f0f0f0; }

.post-body { line-height: 1.85; color: #333; font-size: 16px; }
.post-body :deep(h1), .post-body :deep(h2), .post-body :deep(h3) { color: #111; margin: 28px 0 14px; font-weight: 700; }
.post-body :deep(p) { margin: 0 0 16px; }
.post-body :deep(img) { max-width: 100%; border-radius: 4px; margin: 16px 0; }
.post-body :deep(code) { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-size: .9em; border: 1px solid #eee; }
.post-body :deep(pre) { background: #f7f7f7; padding: 18px; border: 1px solid #eee; border-radius: 6px; overflow-x: auto; margin: 16px 0; }
.post-body :deep(pre code) { background: none; border: none; padding: 0; }
.post-body :deep(blockquote) { border-left: 3px solid #ccc; margin: 16px 0; padding: 6px 16px; color: #777; background: #fafafa; border-radius: 0 4px 4px 0; }
.post-body :deep(a) { color: #111; text-decoration: underline; text-underline-offset: 2px; }

.comments-section { margin-top: 48px; padding-top: 28px; border-top: 1px solid #eee; }
.comments-section h2 { font-size: 18px; color: #111; margin-bottom: 18px; font-weight: 600; }

.comment-item { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid #f5f5f5; }
.comment-item:last-child { border-bottom: none; }
.comment-avatar { width: 34px; height: 34px; border-radius: 50%; background: #222; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.comment-body { flex: 1; min-width: 0; }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.comment-header strong { color: #111; font-size: 13px; }
.comment-header span { color: #bbb; font-size: 11px; }
.comment-body p { margin: 0; line-height: 1.6; color: #555; font-size: 14px; }

.no-comments { text-align: center; color: #bbb; padding: 36px; background: #fafafa; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }

.comment-form { background: #fafafa; padding: 22px; border-radius: 8px; border: 1px solid #eee; margin-top: 20px; }
.comment-form input, .comment-form textarea { width: 100%; padding: 11px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; font-family: inherit; margin-bottom: 10px; transition: all .2s; background: #fff; color: #333; }
.comment-form input:focus, .comment-form textarea:focus { outline: none; border-color: #888; box-shadow: 0 0 0 2px rgba(0,0,0,.04); }
.comment-form button { background: #111; color: #fff; border: none; padding: 11px 28px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background .2s; }
.comment-form button:hover:not(:disabled) { background: #333; }
.comment-form button:disabled { opacity: .4; cursor: not-allowed; }
.error-msg { color: #d00; margin-top: 8px; font-size: 13px; padding: 8px 12px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 5px; }
.success-msg { color: #16a34a; margin-top: 8px; font-size: 13px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 5px; }

@media (max-width: 768px) {
  .channel-home { padding: 20px 16px 40px; }
  .post-title { font-size: 24px; }
  .comment-item { flex-direction: column; gap: 8px; }
}
</style>
