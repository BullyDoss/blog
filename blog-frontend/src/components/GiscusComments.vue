<template>
  <div class="giscus-wrapper">
    <div ref="giscusContainer"></div>
  </div>
</template>

<script>
export default {
  name: 'GiscusComments',
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
    loading: { type: String, default: 'lazy' },
  },
  data() {
    return {
      scriptElement: null,
    };
  },
  watch: {
    '$route.params.slug': {
      handler() {
        this.updateGiscus();
      }
    },
    theme(newTheme) {
      this.updateGiscusTheme(newTheme);
    }
  },
  mounted() {
    this.initGiscus();
  },
  beforeUnmount() {
    this.removeGiscus();
  },
  methods: {
    initGiscus() {
      if (!this.$refs.giscusContainer) return;

      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.async = true;
      script.crossOrigin = 'anonymous';

      const config = {
        'data-repo': this.repo,
        'data-repo-id': this.repoId,
        'data-category': this.category,
        'data-category-id': this.categoryId,
        'data-mapping': this.mapping,
        'data-term': this.term || undefined,
        'data-strict': String(this.strict),
        'data-reactions-enabled': String(this.reactionsEnabled),
        'data-emit-metadata': String(this.emitMetadata),
        'data-input-position': this.inputPosition,
        'data-theme': this.theme,
        'data-lang': this.lang,
        'data-loading': this.loading,
      };

      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined) {
          script.setAttribute(key, value);
        }
      });

      this.$refs.giscusContainer.appendChild(script);
      this.scriptElement = script;
    },

    updateGiscus() {
      if (this.scriptElement) {
        const iframe = document.querySelector('.giscus-frame');
        if (iframe) {
          iframe.remove();
        }
        this.initGiscus();
      }
    },

    updateGiscusTheme(theme) {
      const iframe = document.querySelector('iframe.giscus-frame');
      if (iframe) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme } } },
          'https://giscus.app'
        );
      }
    },

    removeGiscus() {
      if (this.$refs.giscusContainer) {
        this.$refs.giscusContainer.innerHTML = '';
      }
      this.scriptElement = null;
    },
  },
};
</script>

<style scoped>
.giscus-wrapper {
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid #eee;
}

.giscus-wrapper :deep(.giscus) {
  border: none;
}

@media (max-width: 768px) {
  .giscus-wrapper {
    margin-top: 32px;
    padding-top: 20px;
  }
}
</style>
