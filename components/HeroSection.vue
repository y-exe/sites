<script setup lang="ts">
import { useIntro } from '~/composables/useIntro'

const props = defineProps<{
  onScrollTo: (e: Event, id: string) => void
}>()

const emit = defineEmits(['open-pgp'])
const { setIntroRef } = useIntro()

const discordStatus = ref('offline')
const customStatus = ref({ emoji: '', text: '', visible: false })

const fetchDiscord = async () => {
  try {
    const res = await fetch('https://api.lanyard.rest/v1/users/1438769007636385914')
    const { data } = await res.json()
    if (data) {
      if (data.discord_status) discordStatus.value = data.discord_status
      const activity = data.activities.find((a: any) => a.type === 4)
      if (activity?.state) {
        let emojiHtml = ''
        if (activity.emoji) {
           emojiHtml = activity.emoji.id 
            ? `<img src="https://cdn.discordapp.com/emojis/${activity.emoji.id}.${activity.emoji.animated ? 'gif' : 'png'}" class="custom-status-emoji">`
            : `<span>${activity.emoji.name}</span>`
        }
        customStatus.value = { emoji: emojiHtml, text: activity.state, visible: true }
      }
    }
  } catch {}
}

const copyEmail = () => {
  navigator.clipboard.writeText('y.exe.1201@proton.me').then(() => alert('メールアドレスをコピーしました'))
}

onMounted(() => {
  fetchDiscord()
})
</script>

<template>
  <section class="section main" id="top">
    <header class="hero-text">
      <!-- 
        テキスト系は v-split-text が data-split-text をつけるが、
        ここも初期非表示を確実にするため class="intro-sequence" にCSSを当てるのがベスト。
        (後述のCSS追記で対応します)
      -->
      <p class="text-line-1 intro-sequence" :ref="setIntroRef" v-split-text>
        <span v-for="(char, i) in `(*'▽')`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
      </p>
      
      <p class="text-line-2 intro-sequence" :ref="setIntroRef" v-split-text>
        <span v-for="(char, i) in `I'm `.split('')" :key="`im-${i}`" class="char" :style="`--char-delay: ${i*50}ms`">{{ char === ' ' ? '&nbsp;' : char }}</span>
        <span class="char" :style="`--char-delay: ${4*50}ms`">
          <span class="gradient-text">Hentai</span>
        </span>
      </p>
      
      <p class="text-line-3 intro-sequence" :ref="setIntroRef" v-split-text>
        <span v-for="(char, i) in `現在活動停止中かもしれない。`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
      </p>
    </header>

    <!-- 
      【修正ポイント】
      v-reveal だけだとJS実行まで属性がつかないので、
      data-reveal="up" を静的に記述して最初からCSSを適用させる。
    -->
    <div class="quick-nav-buttons intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
      <a href="#projects" class="quick-nav-btn btn-primary" @click="onScrollTo($event, '#projects')">Projects <i class="fa-solid fa-arrow-right"></i></a>
      <a href="#about" class="quick-nav-btn btn-secondary" @click="onScrollTo($event, '#about')">About <i class="fa-solid fa-arrow-right"></i></a>
    </div>
    
    <div class="contact-section">
      <div class="contact-links">
        <a href="https://discord.com/users/1438769007636385914" target="_blank" class="contact-item discord intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <div class="discord-banner"><video autoplay loop muted playsinline src="/Discord.webm"></video></div>
          <div class="discord-pfp">
            <div class="discord-pfp-wrapper">
              <NuxtImg src="/icon.webp" width="65" height="65" format="webp" />
              <span class="status-indicator" :class="discordStatus"></span>
            </div>
          </div>
          <div class="discord-text">
            <div v-if="customStatus.visible" class="custom-status-bubble visible">
              <span class="custom-status-text" v-html="`${customStatus.emoji} ${customStatus.text}`"></span>
            </div>
            <span class="discord-display-name">(*'▽')</span>
            <span class="discord-username">@y_xyz</span>
          </div>
          <i class="fa-brands fa-discord discord-icon"></i>
        </a>
        
        <a href="https://x.com/y__exe" target="_blank" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <div class="contact-info-left"><i class="fa-brands fa-twitter"></i><span class="contact-name">Twitter</span></div>
          <span class="contact-username-pill">@y__exe</span>
        </a>
        <a href="https://github.com/y-exe" target="_blank" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <div class="contact-info-left"><i class="fa-brands fa-github"></i><span class="contact-name">GitHub</span></div>
          <span class="contact-username-pill">@y-exe</span>
        </a>
        <a href="https://t.me/h_exe" target="_blank" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <div class="contact-info-left"><i class="fa-brands fa-telegram"></i><span class="contact-name">Telegram</span></div>
          <span class="contact-username-pill">@h_exe</span>
        </a>
        <a href="https://signal.me/#eu/coWGpls-QtNkrqZ8-wohlyrkC35mfWNncnTFRuoU_q6P9mXTqnpDp4h1g05dWLTY" target="_blank" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <div class="contact-info-left"><i class="fa-brands fa-signal-messenger"></i><span class="contact-name">Signal</span></div>
          <span class="contact-username-pill">@yexe.77</span>
        </a>
        <a href="#" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up" @click.prevent="copyEmail">
          <div class="contact-info-left"><i class="fa-solid fa-envelope"></i><span class="contact-name">Email</span></div>
          <span class="contact-username-pill">y.exe.1201</span>
        </a>
        <a href="#" class="contact-item intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up" @click.prevent="emit('open-pgp')">
          <div class="contact-info-left"><i class="fa-solid fa-key"></i><span class="contact-name">PGP</span></div>
          <span class="contact-username-pill">Public Key</span>
        </a>
        
        <div class="server-status intro-sequence" :ref="setIntroRef" v-reveal data-reveal="up">
          <h3 class="hover-highlight" v-split-text>
            <span v-for="(char, i) in `起動状況`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
          </h3>
          <div class="shields-group">
            <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F2511f393-7539-4092-9170-0f0c4d5809ac.shields" alt="Server1" width="100" height="20">
            <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F9dabb00b-609f-4519-9193-dac9575a3953.shields" alt="Server2" width="100" height="20">
          </div>
        </div>
      </div>
    </div>
    
    <a href="#projects" id="scroll-down-container" class="intro-sequence" :ref="setIntroRef" aria-label="Scroll to Projects" v-reveal data-reveal="up" @click="onScrollTo($event, '#projects')">
      <span class="scroll-down-text">Projects</span>
      <i class="fa-solid fa-chevron-down scroll-down-icon"></i>
    </a>
    <div id="scroll-trigger"></div>
  </section>
</template>