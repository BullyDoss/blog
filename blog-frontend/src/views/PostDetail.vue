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

        <!-- 评论 (GitHub 登录评论) -->
        <section class="comments-section">
          <h2>评论区</h2>
          <p class="comments-hint">使用 GitHub 账号登录后即可参与讨论</p>

          <!-- 一体化评论组件（含图片工具） -->
          <GiscusCommentSection
            :repo="giscusConfig.repo"
            :repo-id="giscusConfig.repoId"
            :category-id="giscusConfig.categoryId"
            :mapping="giscusConfig.mapping"
            :theme="giscusConfig.theme"
            :reactions-enabled="giscusConfig.reactionsEnabled"
          />
        </section>
      </article>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';
import GiscusCommentSection from '@/components/GiscusCommentSection.vue';

export default {
  name: 'PostDetail',
  components: { GiscusCommentSection },
  props: {
    channelKey: { type: String, required: true },
    channelConfig: { type: Object, required: true },
  },
  data() {
    return {
      posts: [],
      selectedPost: null,
      images: [],
      loading: false,
      giscusConfig: {
        repo: 'BullyDoss/blog',
        repoId: 'R_kgDOSSGQ7g',
        categoryId: 'DIC_kwDOSSGQ7s4C8LJx',
        mapping: 'pathname',
        theme: 'light',
        reactionsEnabled: '0',
      },
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
      return url.startsWith('http') ? url : `http://localhost:3000${url}`;
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
        const res = await axios.get('http://localhost:3000/api/posts', {
          params: { category: this.channelKey }, timeout: 8000
        });
        this.posts = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('获取列表失败:', err.message);
      }
    },

    async loadPost(slug) {
      this.loading = true;
      try {
        const postRes = await axios.get(`http://localhost:3000/api/posts/${slug}`);
        this.selectedPost = postRes.data;

        const imgRes = await axios.get(`http://localhost:3000/api/posts/${this.selectedPost.id}/images`);
        this.images = imgRes.data;
      } catch (err) {
        console.error('加载文章失败:', err);
      } finally {
        this.loading = false;
      }
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
.comments-section h2 { font-size: 18px; color: #111; margin-bottom: 8px; font-weight: 600; }
.comments-hint { font-size: 13px; color: #888; margin-bottom: 20px; }

@media (max-width: 768px) {
  .channel-home { padding: 20px 16px 40px; }
  .post-title { font-size: 24px; }
}
</style>
