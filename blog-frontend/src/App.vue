<template>
  <div id="app">
    <template v-if="showSidebar">
      <div class="blog-layout">
      <!-- 左侧区域 -->
      <div class="sidebar-area">
        <div class="sidebar-brand">
          <span class="site-name">Helloworld的笔记</span>
          <span class="site-arrow">∨</span>
        </div>
        <BlogSidebar :search-query="searchQuery" />
      </div>

      <!-- 右侧区域 -->
      <div class="right-area">
        <!-- 第一行：搜索框 -->
        <div class="search-bar">
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            placeholder="搜索..."
          />
        </div>

        <!-- 第二行：Tab栏 -->
        <nav class="channel-tabs">
          <router-link
            v-for="ch in channels"
            :key="ch.key"
            :to="'/' + ch.key"
            class="tab-item"
            :class="{ active: currentChannel === ch.key }"
          >{{ ch.label }}</router-link>
        </nav>

        <!-- 内容区 -->
        <div class="content-area">
          <router-view />
        </div>
      </div>
      </div>
    </template>

    <router-view v-else />
  </div>
</template>

<script>
import BlogSidebar from '@/components/BlogSidebar.vue'

export default {
  name: 'App',
  components: { BlogSidebar },
  data() {
    return {
      searchQuery: '',
      channels: [
        { key: 'notes', label: '学习笔记' },
        { key: 'brainstorm', label: '思维风暴' },
        { key: 'chat', label: '生活碎片' },
        { key: 'daily', label: '投稿专区' },
        { key: 'submit', label: '我要投稿' },
      ],
    }
  },
  computed: {
    showSidebar() { return !this.$route.path.startsWith('/admin') },
    currentChannel() {
      const seg = this.$route.path.split('/').filter(Boolean)[0]
      return ['notes', 'brainstorm', 'chat', 'daily', 'submit'].includes(seg) ? seg : 'notes'
    },
  },
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #222; }
#app { width: 100%; }

/* ===== 博客布局（仅前台） ===== */
.blog-layout { display: flex; }

/* ===== 左侧 ===== */
.sidebar-area {
  width: 240px; flex-shrink: 0;
  position: fixed; top: 0; left: 0; height: 100vh;
  z-index: 100; background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex; flex-direction: column;
}

.sidebar-brand {
  height: 50px; display: flex; align-items: center; gap: 3px;
  padding: 0 16px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;
}
.site-name { font-size: 15px; font-weight: 600; color: #111; }
.site-arrow { font-size: 11px; color: #999; cursor: pointer; }

/* ===== 右侧 ===== */
.right-area { margin-left: 240px; flex: 1; }

.search-bar {
  position: fixed; top: 0; left: 240px; right: 0;
  height: 50px; background: #fff; border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; padding: 0 20px; z-index: 90;
}

.search-input {
  width: 220px; height: 32px; padding: 0 14px;
  border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 13px; color: #333; background: #f9fafb;
  outline: none; transition: all .2s; font-family: inherit;
}
.search-input:focus { background: #fff; border-color: #9ca3af; box-shadow: 0 0 0 2px rgba(0,0,0,.04); }
.search-input::placeholder { color: #bbb; }

.channel-tabs {
  position: fixed; top: 50px; left: 240px; right: 0;
  height: 44px; background: #fff; border-bottom: 1px solid #eee;
  display: flex; align-items: center; padding-left: 24px; z-index: 90;
}

.tab-item {
  padding: 12px 20px; font-size: 14px; color: #888;
  text-decoration: none; position: relative; transition: color .2s;
}
.tab-item:hover { color: #333; }
.tab-item.active { color: #111; font-weight: 600; }
.tab-item.active::after {
  content: ''; position: absolute; bottom: -2px; left: 20px; right: 20px;
  height: 2px; background: #111;
}

.content-area { padding-top: 94px; }

@media (max-width: 768px) {
  .sidebar-area { width: 0; overflow: hidden; }
  .right-area { margin-left: 0; }
  .search-bar { left: 56px; }
  .channel-tabs { left: 0; }
}
</style>
