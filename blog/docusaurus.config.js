module.exports = {
  title: 'BullyDoss的不务正业笔记',
  tagline: '学习笔记 · 思维风暴 · 夸夸其谈 · 打怪经验',

  url: 'https://bullydoss.com',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  organizationName: 'BullyDoss',
  projectName: 'blog',
  trailingSlash: false,

  clientModules: [
    require.resolve('./src/client/config.js'),
  ],

  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
    localeConfigs: {
      'zh-CN': { label: '简体中文' },
    },
  },

  customFields: {
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.bullydoss.com',
    r2BucketUrl: process.env.R2_BUCKET_URL || 'https://pub-xxxxx.r2.dev',
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'BullyDoss的不务正业笔记',
      logo: {
        alt: 'BullyDoss',
        src: 'img/duck.png',
        href: '/admin',
      },
      items: [
        {
          to: '/tags/学习笔记',
          label: '学习笔记',
          position: 'left',
        },
        {
          to: '/tags/思维风暴',
          label: '思维风暴',
          position: 'left',
        },
        {
          to: '/tags/夸夸其谈',
          label: '夸夸其谈',
          position: 'left',
        },
        {
          to: '/tags/打怪经验',
          label: '打怪经验',
          position: 'left',
        },
        {
          to: '/submit',
          label: '投稿专区',
          position: 'left',
        },
        { to: '/admin', label: '管理后台', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} BullyDoss的不务正业笔记. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ['bash', 'python', 'javascript', 'typescript'],
      theme: {
        plain: {},
        styles: [],
      },
    },
  },
};
