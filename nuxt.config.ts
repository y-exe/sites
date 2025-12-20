export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: ['@nuxt/image'],

  css: ['~/assets/css/style.css'],

  app: {
    head: {
      title: "yexe/(*'▽') Portfolio | yexe.net",
      htmlAttrs: {
        lang: 'ja'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: "y_exe (yexe) のポートフォリオ。開発したプロジェクト、使用技術 (Python, TypeScript, Next.js等)、各種SNSへのリンクを掲載しています。" },
        { name: 'author', content: 'y_exe' },
        
        { property: 'og:title', content: "y_exe's Portfolio" },
        { property: 'og:description', content: "y_exe (yexe) のポートフォリオサイト。" },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://yexe.net/' },
        { property: 'og:image', content: 'https://yexe.net/icon.webp' },
        { property: 'og:site_name', content: 'yexe.net' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@y__exe' },
      ],
      link: [
        { rel: 'icon', type: 'image/webp', href: '/icon.webp' },
        
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Orbitron:wght@400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap' },
        
        { 
          rel: 'stylesheet', 
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
          media: 'print',
          onload: "this.media='all'"
        }
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": "y_exe",
              "image": "https://yexe.net/icon.webp",
              "url": "https://yexe.net"
            }
          })
        }
      ]
    }
  }
})