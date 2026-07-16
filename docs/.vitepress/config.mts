import { defineConfig } from 'vitepress'

const site = 'https://kinesis-producer-go.github.io'

export default defineConfig({
  title: 'kinesis-producer',
  titleTemplate: ':title | kinesis-producer',
  description: 'A KPL-like batch producer for Amazon Kinesis, built on the AWS SDK for Go V2',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  // Root/org page (repo name == kinesis-producer-go.github.io), so no path prefix.
  base: '/',

  sitemap: {
    // Gotcha (learned the hard way on a previous project): hostname must have
    // a trailing slash, otherwise generated URLs lose the base path.
    hostname: `${site}/`,
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'kinesis-producer' }],
    // meta keywords has ~no effect on Google ranking (Google confirmed this
    // in 2009) but costs nothing and other engines still glance at it.
    [
      'meta',
      {
        name: 'keywords',
        content:
          'kinesis producer, aws kinesis go, kpl, kinesis producer library, golang kinesis, aws-sdk-go-v2, kinesis aggregation, kinesis batch producer',
      },
    ],
    // Google Search Console verification file lives at docs/public/ instead
    // (HTML-file method), added once Bob creates the property in Search Console.
  ],

  transformPageData(pageData) {
    const canonicalPath = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
    const canonicalUrl = `${site}/${canonicalPath}`
    const title = pageData.frontmatter.title ?? pageData.title ?? 'kinesis-producer'
    const description = pageData.frontmatter.description ?? pageData.description

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: `${site}/social-preview.png` }],
      ['meta', { property: 'og:image:type', content: 'image/png' }],
      ['meta', { property: 'og:image:width', content: '1280' }],
      ['meta', { property: 'og:image:height', content: '640' }],
      ['meta', { property: 'og:image:alt', content: 'kinesis-producer — KPL-compatible batching for Amazon Kinesis in Go' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: `${site}/social-preview.png` }],
      ['meta', { name: 'twitter:image:alt', content: 'kinesis-producer — KPL-compatible batching for Amazon Kinesis in Go' }],
    )

    // Structured data (JSON-LD) so Google can associate the site with the
    // GitHub repo, license, and language as a distinct software entity.
    if (pageData.relativePath === 'index.md') {
      pageData.frontmatter.head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: 'kinesis-producer',
          description:
            'A KPL-like batch producer for Amazon Kinesis, built on the AWS SDK for Go V2, using the same aggregation format as the KPL.',
          url: `${site}/`,
          image: `${site}/social-preview.png`,
          codeRepository: 'https://github.com/kinesis-producer-go/kinesis-producer',
          programmingLanguage: 'Go',
          license: 'https://github.com/kinesis-producer-go/kinesis-producer/blob/main/LICENSE',
        }),
      ])
    }
  },

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'kinesis-producer' },

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

    search: {
      provider: 'local',
    },

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
