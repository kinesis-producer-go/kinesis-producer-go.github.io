import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'kinesis-producer',
  description: 'A KPL-like batch producer for Amazon Kinesis, built on the AWS SDK for Go V2',
  lang: 'en-US',
  cleanUrls: true,
  // Root/org page (repo name == kinesis-producer-go.github.io), so no path prefix.
  base: '/',

  sitemap: {
    // Gotcha (learned the hard way on a previous project): hostname must have
    // a trailing slash, otherwise generated URLs lose the base path.
    hostname: 'https://kinesis-producer-go.github.io/',
  },

  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'kinesis-producer' }],
    ['meta', { property: 'og:url', content: 'https://kinesis-producer-go.github.io/' }],
    // Google Search Console verification file lives at docs/public/ instead
    // (HTML-file method), added once Bob creates the property in Search Console.
  ],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Usage', link: '/usage' },
      { text: 'Aggregation Format', link: '/aggregation-format' },
      { text: 'GoDoc', link: 'https://pkg.go.dev/github.com/kinesis-producer-go/kinesis-producer' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Usage', link: '/usage' },
          { text: 'Aggregation Format', link: '/aggregation-format' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kinesis-producer-go/kinesis-producer' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © kinesis-producer-go contributors',
    },

    editLink: {
      pattern: 'https://github.com/kinesis-producer-go/kinesis-producer-go.github.io/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
