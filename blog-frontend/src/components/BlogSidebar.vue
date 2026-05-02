<template>
  <aside class="blog-sidebar">
    <div v-if="loading" class="sidebar-loading">加载中...</div>
    <div v-else-if="filteredPosts.length === 0" class="no-posts">
      {{ searchQuery ? '没有找到相关文章' : '还没有文章' }}
    </div>
    <div v-else class="nav-section">
      <div class="nav-header">文章导航</div>
      <router-link
        v-for="post in filteredPosts"
        :key="post.id"
        :to="'/' + (post.category || 'notes') + '/' + post.slug"
        class="nav-item"
        :class="{ active: currentSlug === post.slug }"
      >
        <span class="nav-badge" :class="'badge-' + (post.category || 'notes')">{{ categoryLabel(post.category) }}</span>
        <span class="nav-title">{{ post.title }}</span>
        <span class="nav-date">{{ formatDate(post.created_at) }}</span>
      </router-link>
    </div>
  </aside>
</template>

<script>
import axios from 'axios'
import { api } from '@/utils/api.js'

export default {
  name: 'BlogSidebar',
  props: {
    searchQuery: { type: String, default: '' }
  },
  data() {
    return {
      posts: [],
      loading: true
    }
  },
  computed: {
    currentSlug() {
      return this.$route.params.slug || null
    },
    filteredPosts() {
      if (!this.searchQuery) return this.posts
      const kw = this.searchQuery.toLowerCase()
      return this.posts.filter(p => {
        const t = (p.title || '').toLowerCase()
        const e = (p.excerpt || '').toLowerCase()
        return t.includes(kw) || e.includes(kw)
      })
    }
  },
  methods: {
    categoryLabel(c) {
      const m = { notes: '学习笔记', brainstorm: '思维风暴', chat: '夸夸其谈', daily: '投稿专区', submit: '我要投稿' }
      return m[c] || c
    },
    formatDate(d) {
      const dt = new Date(d)
      return (dt.getMonth() + 1) + '月' + dt.getDate() + '日'
    },
    async fetchPosts() {
      this.loading = true
      try {
        const res = await axios.get(api('/api/posts'), { timeout: 8000 })
        this.posts = Array.isArray(res.data) ? res.data : []
      } catch (e) {
        console.error('获取文章失败:', e.message || e)
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.fetchPosts()
  }
}
</script>

<style scoped>
.blog-sidebar {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-loading,
.no-posts {
  padding: 20px 16px;
  color: #bbb;
  font-size: 13px;
}

.nav-section {
  padding: 4px 6px;
}

.nav-header {
  padding: 12px 10px 6px;
  font-size: 11px;
  color: #bbb;
  font-weight: 600;
  letter-spacing: .5px;
}

.nav-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 5px;
  color: #666;
  text-decoration: none;
  transition: background .1s, color .1s;
  margin-bottom: 1px;
}

.nav-item:hover {
  background: #f5f5f5;
  color: #111;
}

.nav-item.active {
  background: #111;
  color: #fff;
}

.nav-item.active .nav-badge {
  color: rgba(255,255,255,.8);
  background: rgba(255,255,255,.15);
}

.nav-item.active .nav-date {
  color: rgba(255,255,255,.55);
}

.nav-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
}

.badge-notes,
.badge-brainstorm,
.badge-chat,
.badge-daily {
  background: #eee;
  color: #888;
}

.nav-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.nav-date {
  font-size: 11px;
  color: #ccc;
  margin-left: auto;
}
</style>
