module.exports = {
  title: 'Helloworld的笔记',
  tagline: '学习笔记 · 思维风暴 · 生活碎片',

  url: 'https://your-blog.pages.dev',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  organizationName: 'your-github-username',
  projectName: 'blog',
  trailingSlash: false,

  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
    localeConfigs: {
      'zh-CN': { label: '简体中文' },
    },
  },

  customFields: {
    apiBaseUrl: process.env.API_BASE_URL || 'https://blog-api.bullydoss-blog.workers.dev',
    r2BucketUrl: process.env.R2_BUCKET_URL || 'https://pub-xxxxx.r2.dev',
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: false,
        blog: {
          routeBasePath: '/',
          blogTitle: 'Helloworld的笔记',
          blogDescription: '学习笔记 · 思维风暴 · 生活碎片',
          postsPerPage: 10,
          blogSidebarCount: 'ALL',
          authorsMapPath: 'authors.yml',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Helloworld的笔记',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/notes', label: '学习笔记', position: 'left' },
        { to: '/brainstorm', label: '思维风暴', position: 'left' },
        { to: '/chat', label: '生活碎片', position: 'left' },
        { to: '/daily', label: '投稿专区', position: 'left' },
        { to: '/submit', label: '我要投稿', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Helloworld的笔记. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['bash', 'python', 'javascript', 'typescript'],
      theme: {
        plain: {},
        styles: [],
      },
    },
    giscus: {
      repo: 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME',
      repoId: 'YOUR_REPO_ID',
      category: 'Announcements',
      categoryId: 'YOUR_CATEGORY_ID',
      mapping: 'pathname',
      strict: true,
      reactionsEnabled: true,
      emitMetadata: false,
      inputPosition: 'top',
      lang: 'zh-CN',
      loading: 'lazy',
    },
  },
};
