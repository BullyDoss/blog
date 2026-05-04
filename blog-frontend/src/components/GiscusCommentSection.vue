<template>
  <div class="giscus-comment-section">
    <div ref="giscusContainer"></div>
    <div v-if="loadingError" class="err-overlay">
      <p>{{ loadingError }}</p>
      <button @click="retry" class="rt-btn">重试</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GiscusCommentSection',
  props: {
    repo: { type: String, required: true },
    repoId: { type: String, required: true },
    categoryId: { type: String, required: true },
    category: { type: String, default: 'Announcements' },
    mapping: { type: String, default: 'pathname' },
    term: { type: String, default: '' },
    strict: { type: [String, Boolean], default: '0' },
    reactionsEnabled: { type: [String, Boolean], default: '1' },
    emitMetadata: { type: [String, Boolean], default: '0' },
    inputPosition: { type: String, default: 'top' },
    theme: { type: String, default: 'light' },
    lang: { type: String, default: 'zh-CN' },
    loading: { type: String, default: 'eager' },
  },
  data() {
    return { scriptEl: null, loadingError: '' };
  },
  watch: {
    '$route.params.slug': { handler() { this.reload(); } },
    theme(v) { this.setTheme(v); }
  },
  mounted() { this.init(); window.addEventListener('message', this.onMsg); },
  beforeUnmount() { this.remove(); window.removeEventListener('message', this.onMsg); },
  methods: {
    onMsg(e) {
      if (e.origin !== 'https://giscus.app') return;
      if (e.data.giscus?.discussion) this.loadingError = '';
    },

    init() {
      if (!this.$refs.giscusContainer) return;
      this.loadingError = '';
      this.$refs.giscusContainer.innerHTML = '';
      const s = document.createElement('script');
      s.src = 'https://giscus.app/client.js'; s.async = true; s.crossOrigin = 'anonymous';
      const c = {
        'data-repo': this.repo, 'data-repo-id': this.repoId,
        'data-category': this.category, 'data-category-id': this.categoryId,
        'data-mapping': this.mapping, 'data-term': this.term || undefined,
        'data-strict': String(this.strict), 'data-reactions-enabled': String(this.reactionsEnabled),
        'data-emit-metadata': String(this.emitMetadata), 'data-input-position': this.inputPosition,
        'data-theme': this.theme, 'data-lang': this.lang, 'data-loading': 'eager',
      };
      Object.entries(c).forEach(([k, v]) => { if (v !== undefined) s.setAttribute(k, v); });
      s.onerror = () => { this.loadingError = '加载失败'; };
      this.$refs.giscusContainer.appendChild(s); this.scriptEl = s;
    },

    reload() { if (this.scriptEl) { const f = document.querySelector('.giscus-frame'); if (f) f.remove(); this.init(); } },
    setTheme(t) { const f = document.querySelector('iframe.giscus-frame'); if (f) f.contentWindow.postMessage({ giscus: { setConfig: { theme: t } } }, 'https://giscus.app'); },
    remove() { if (this.$refs.giscusContainer) this.$refs.giscusContainer.innerHTML = ''; this.scriptEl = null; },
    retry() { this.remove(); setTimeout(() => this.init(), 100); },
  },
};
</script>

<style scoped>
.giscus-comment-section { width: 100%; }

.err-overlay {
  text-align: center; padding: 28px 18px; background: #fef2f2;
  border: 2px solid #fecaca; border-radius: 8px;
}
.err-overlay p { color: #991b1b; font-weight: 600; margin: 0 0 10px; }
.rt-btn { padding: 7px 18px; background: #dc2626; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.rt-btn:hover { background: #b91c1c; }
</style>
