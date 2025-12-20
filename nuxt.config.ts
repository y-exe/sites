// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/image',
    '@vueuse/nuxt'
  ],

  css: ['~/assets/css/style.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'author', content: 'y_exe' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@y__exe' },
      ],
      link: [
        { rel: 'icon', type: 'image/webp', href: '/icon.webp' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Orbitron:wght@400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css' }
      ]
    }
  }
})