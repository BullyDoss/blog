<template>
  <div class="home">
    <div class="home-header">
      <h1 class="home-title">
        {{ searchKeyword ? `搜索结果: "${searchKeyword}"` : '最新文章' }}
      </h1>
      <p class="home-desc" v-if="!searchKeyword">这里有我的思考、学习和技术分享</p>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="loading-spinner"></span>
      <p>加载文章中...</p>
    </div>

    <div v-else-if="filteredPosts.length === 0" class="empty-state">
      <template v-if="searchKeyword">
        没有找到包含 "{{ searchKeyword }}" 的文章
      </template>
      <template v-else>
        还没有发布任何文章
      </template>
    </div>

    <div v-else class="posts-list">
      <article v-for="post in filteredPosts" :key="post.id" class="post-card">
        <div class="card-left">
          <div class="card-date">
            <span class="date-day">{{ new Date(post.created_at).getDate() }}</span>
            <span class="date-month">{{ new Date(post.created_at).getMonth() + 1 }} 月</span>
          </div>
        </div>
        <div class="card-right">
          <h2 class="card-title">
            <router-link :to="'/post/' + post.slug">{{ post.title }}</router-link>
          </h2>
          <p class="card-excerpt">{{ post.excerpt || (post.content && post.content.slice(0, 150) + '...') || '' }}</p>
          <div class="card-meta">
            <span class="meta-year">{{ new Date(post.created_at).getFullYear() }}</span>
            <span class="meta-divider">/</span>
            <router-link :to="'/post/' + post.slug" class="read-more">阅读</router-link>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      posts: [],
      loading: true,
    };
  },
  computed: {
    searchKeyword() {
      return (this.$route.query.q || '').trim();
    },
    filteredPosts() {
      if (!this.searchKeyword) return this.posts;
      const kw = this.searchKeyword.toLowerCase();
      return this.posts.filter(post => {
        const title = (post.title || '').toLowerCase();
        const excerpt = (post.excerpt || '').toLowerCase();
        return title.includes(kw) || excerpt.includes(kw);
      });
    },
  },
  watch: {
    '$route.query.q'() {
      // search changes handled by computed
    },
  },
  async mounted() {
    try {
      const res = await axios.get('http://localhost:3000/api/posts', { timeout: 8000 });
      this.posts = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('获取文章失败:', err.message || err);
    } finally {
      this.loading = false;
    }
  },
};
</script>

<style scoped>
.home {
  max-width: 780px;
  margin: 0 auto;
  padding: 40px 32px;
}

.home-header {
  margin-bottom: 36px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.home-title {
  font-size: 28px;
  color: #111;
  margin-bottom: 6px;
  font-weight: 700;
}

.home-desc {
  color: #999;
  font-size: 14px;
  margin: 0;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
  font-size: 15px;
}

.posts-list {
  display: flex;
  flex-direction: column;
}

.post-card {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid #eee;
  transition: transform 0.15s;
  cursor: default;
}

.post-card:hover {
  transform: translateX(4px);
}

.card-left {
  flex-shrink: 0;
}

.card-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  min-width: 52px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.date-day {
  font-size: 24px;
  font-weight: 700;
  color: #111;
  line-height: 1;
}

.date-month {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.card-right {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 19px;
  margin: 0 0 8px;
  line-height: 1.35;
}

.card-title a {
  color: #111;
  text-decoration: none;
}

.card-title a:hover {
  color: #555;
}

.card-excerpt {
  color: #777;
  line-height: 1.65;
  margin: 0 0 12px;
  font-size: 14px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #bbb;
}

.meta-divider {
  color: #ddd;
}

.read-more {
  color: #555;
  text-decoration: none;
  font-weight: 500;
}

.read-more:hover {
  color: #111;
}

@media (max-width: 768px) {
  .home {
    padding: 20px 20px 40px;
  }

  .home-title {
    font-size: 22px;
  }

  .post-card {
    flex-direction: column;
    gap: 10px;
  }

  .card-date {
    flex-direction: row;
    gap: 4px;
    padding: 6px 12px;
    min-width: auto;
  }

  .date-day {
    font-size: 15px;
  }

  .date-month {
    font-size: 11px;
    margin-top: 0;
  }
}
</style>
