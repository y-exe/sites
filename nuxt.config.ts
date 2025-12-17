// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // CSSファイルの登録
  css: ['~/assets/css/style.css'],

  // SEO情報と外部リソース
  app: {
    head: {
      title: "yexe/(*'▽') Portfolio | yexe.net",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: "y_exe (yexe) のポートフォリオ。開発したプロジェクト、使用技術 (Python, TypeScript, Next.js等)、各種SNSへのリンクを掲載しています。" },
        { name: 'author', content: 'y_exe' },
        { name: 'keywords', content: 'y_exe, yexe, yexe.net, ポートフォリオ, portfolio, developer, プログラマー' },
        
        // OGP
        { property: 'og:title', content: "y_exe's Portfolio" },
        { property: 'og:description', content: "y_exe (yexe) のポートフォリオサイト。プロジェクトや技術スタックを紹介。" },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://yexe.net/' },
        { property: 'og:image', content: 'https://raw.githubusercontent.com/y-exe/sites/refs/heads/main/file/Discord.webm' },
        { property: 'og:site_name', content: 'yexe.net' },
        
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@y__exe' },
        { name: 'twitter:creator', content: '@y__exe' },
      ],
      link: [
        { rel: 'icon', type: 'image/webp', href: 'https://i.ibb.co/Q3TVtkMj/Xz-G8a-Yo-G-400x400.jpg' },
        // フォント読み込み
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Orbitron:wght@400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' }
      ],
      script: [
        // ★修正済み: children を innerHTML に変更
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": "y_exe",
              "alternateName": "yexe",
              "url": "https://yexe.net",
              "description": "y_exeのポートフォリオです。開発中のプロジェクトや各種SNSへのリンク、技術スタックなどをまとめています。",
              "image": "https://raw.githubusercontent.com/y-exe/sites/refs/heads/main/file/Discord.webm",
              "knowsAbout": ["Python", "TypeScript", "Next.js", "Java", "Kotlin", "JavaScript"],
              "jobTitle": "Developer-wannabe",
              "sameAs": [
                "https://x.com/y__exe",
                "https://github.com/y-exe",
                "https://t.me/h_exe",
                "https://yexe.xyz",
                "https://yexe.jp"
              ]
            }
          })
        }
      ]
    }
  }
})