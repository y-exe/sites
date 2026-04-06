<script setup lang="ts">
import { useIntro } from '~/composables/useIntro'

const props = defineProps<{
  onScrollTo: (e: Event, id: string) => void
}>()

const emit = defineEmits(['open-pgp'])
const { setIntroRef } = useIntro()

const discordStatus = ref('offline')
const customStatus = ref({ emoji: '', text: '', visible: false })
const avatarUrl = ref('/icon.webp')
const discordName = ref("(*'▽')")
const discordUsername = ref("@y_xyz")

const combinedActivityText = computed(() => {
  let text = ''
  if (currentActivity.value?.details) text += currentActivity.value.details
  if (currentActivity.value?.details && currentActivity.value?.state) text += ' - '
  if (currentActivity.value?.state) text += currentActivity.value.state
  if (!currentActivity.value?.timestamps?.end && elapsedFormatted.value) {
    if (text) text += ' - '
    text += `${elapsedFormatted.value} elapsed`
  }
  return text
})

const needsMarquee = computed(() => {
  let len = 0
  const txt = combinedActivityText.value
  for (let i = 0; i < txt.length; i++) {
    len += txt.charCodeAt(i) > 255 ? 2 : 1
  }
  return len > 28
})

const formatTime = (ms: number) => {
  if (ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const elapsedFormatted = computed(() => {
  if (!currentActivity.value?.timestamps?.start) return ''
  const elapsed = Math.max(0, nowMs.value - currentActivity.value.timestamps.start)
  return formatTime(elapsed)
})

const totalFormatted = computed(() => {
  if (!currentActivity.value?.timestamps?.start || !currentActivity.value?.timestamps?.end) return ''
  const total = currentActivity.value.timestamps.end - currentActivity.value.timestamps.start
  return formatTime(total)
})

const playbackProgressPercent = computed(() => {
  if (!currentActivity.value?.timestamps?.start || !currentActivity.value?.timestamps?.end) return 0
  const start = currentActivity.value.timestamps.start
  const end = currentActivity.value.timestamps.end
  const total = end - start
  if (total <= 0) return 0
  const elapsed = Math.max(0, nowMs.value - start)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

const primaryGuild = ref<{ tag: string, badgeUrl: string } | null>(null)
const currentActivity = ref<{ name: string, details: string, state: string, iconUrl: string, timestamps?: { start?: number, end?: number } } | null>(null)

let ws: WebSocket | null = null
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
const nowMs = ref(Date.now())
let timeInterval: ReturnType<typeof setInterval> | null = null

const connectLanyard = () => {
  ws = new WebSocket('wss://api.lanyard.rest/socket')

  if (!ws) return

  ws.onmessage = (event) => {
    const { op, d, t } = JSON.parse(event.data)

    if (op === 1) {
      heartbeatInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ op: 3 }))
        }
      }, d.heartbeat_interval)

      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: '1438769007636385914' } }))
    }

    if (op === 0 && (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE')) {
      updateDiscordData(d)
    }
  }

  ws.onclose = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    setTimeout(connectLanyard, 5000)
  }
}

const updateDiscordData = (data: any) => {
  if (data.discord_status) discordStatus.value = data.discord_status

  if (data.discord_user) {
    discordName.value = data.discord_user.display_name || data.discord_user.global_name || data.discord_user.username || "(*'▽')"
    discordUsername.value = `@${data.discord_user.username || 'y_xyz'}`
    if (data.discord_user.avatar) {
      const ext = data.discord_user.avatar.startsWith('a_') ? 'gif' : 'webp'
      avatarUrl.value = `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.${ext}?size=128`
    }
  }
  
  if (data.discord_user.primary_guild) {
    const guild = data.discord_user.primary_guild
    primaryGuild.value = {
      tag: guild.tag,
      badgeUrl: guild.badge ? `https://cdn.discordapp.com/clan-badges/${guild.identity_guild_id}/${guild.badge}.png` : ''
    }
  } else {
    primaryGuild.value = null
  }

  const customAct = data.activities.find((a: any) => a.type === 4)
  if (customAct && (customAct.state || customAct.emoji)) {
    let emojiHtml = ''
    if (customAct.emoji) {
       emojiHtml = customAct.emoji.id 
        ? `<img src="https://cdn.discordapp.com/emojis/${customAct.emoji.id}.${customAct.emoji.animated ? 'gif' : 'png'}" class="custom-status-emoji">`
        : `<span>${customAct.emoji.name}</span>`
    }
    customStatus.value = { emoji: emojiHtml, text: customAct.state || '', visible: true }
  } else {
    customStatus.value = { emoji: '', text: '', visible: false }
  }

  const otherAct = data.activities.find((a: any) => a.type !== 4)
  if (otherAct) {
    let iconUrl = ''
    if (otherAct.assets?.large_image) {
      const largeImg = otherAct.assets.large_image
      if (largeImg.startsWith('mp:external/')) {
        iconUrl = `https://media.discordapp.net/external/${largeImg.replace('mp:external/', '')}`
      } else if (otherAct.name === 'Spotify') {
        iconUrl = `https://i.scdn.co/image/${largeImg.replace('spotify:', '')}`
      } else {
        iconUrl = `https://cdn.discordapp.com/app-assets/${otherAct.application_id}/${largeImg}.png`
      }
    }
    currentActivity.value = {
      name: otherAct.name,
      details: otherAct.details || '',
      state: otherAct.state || '',
      iconUrl,
      timestamps: otherAct.timestamps
    }
  } else if (data.spotify) {
    currentActivity.value = {
      name: 'Spotify',
      details: data.spotify.song,
      state: data.spotify.artist,
      iconUrl: data.spotify.album_art_url,
      timestamps: data.spotify.timestamps
    }
  } else {
    currentActivity.value = null
  }
}

const copyEmail = () => {
  navigator.clipboard.writeText('y.exe.1201@proton.me').then(() => alert('メールアドレスをコピーしました'))
}

onMounted(() => {
  connectLanyard()
  timeInterval = setInterval(() => { nowMs.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (ws) ws.close()
  if (heartbeatInterval) clearInterval(heartbeatInterval)
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<template>
  <section class="section main" id="top">
    <header class="hero-text">
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
        <span v-for="(char, i) in `適当にコードいじいじします。詳しいことわかんない。`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
      </p>
    </header>

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
              <img :key="avatarUrl" :src="avatarUrl" width="65" height="65" class="discord-avatar-img" />
              <span class="status-indicator" :class="discordStatus"></span>
            </div>
          </div>
          <div class="discord-text">
            <div v-if="customStatus.visible" class="custom-status-bubble visible">
              <span class="custom-status-text" v-html="`${customStatus.emoji} ${customStatus.text}`"></span>
            </div>
            <div v-if="currentActivity" class="discord-activity-bubble" :class="{ 'spotify-bubble': currentActivity.name === 'Spotify' }">
              <img v-if="currentActivity.iconUrl" :src="currentActivity.iconUrl" class="activity-icon" />
              <div class="activity-text-info">
                <div class="activity-name">
                  <i v-if="currentActivity.name === 'Spotify'" class="fa-brands fa-spotify" style="color: #1ed760; margin-right: 4px;"></i>
                  {{ currentActivity.name }}
                </div>
                <div class="activity-details-combined" v-if="combinedActivityText">
                  <div class="marquee-wrapper" :class="{ 'is-marquee': needsMarquee }">
                    <span class="marquee-part">{{ combinedActivityText }}</span>
                    <span class="marquee-part" v-if="needsMarquee">{{ combinedActivityText }}</span>
                  </div>
                </div>
                <div class="activity-progress" v-if="currentActivity.timestamps?.end">
                  <span class="progress-time left">{{ elapsedFormatted }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :class="{ 'spotify': currentActivity.name === 'Spotify' }" :style="{ width: playbackProgressPercent + '%' }"></div>
                  </div>
                  <span class="progress-time right">{{ totalFormatted }}</span>
                </div>
              </div>
            </div>
            <div class="discord-name-wrapper">
              <span class="discord-display-name">{{ discordName }}</span>
              <span class="discord-username">{{ discordUsername }}</span>
              <span v-if="primaryGuild" class="discord-guild-pill">
                <img v-if="primaryGuild.badgeUrl" :src="primaryGuild.badgeUrl" class="guild-badge" />
                <span class="guild-tag">{{ primaryGuild.tag }}</span>
              </span>
            </div>
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
            <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F2511f393-7539-4092-9170-0f0c4d5809ac.shields" alt="Server1" width="100" height="20" loading="eager">
            <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fhealthchecks.io%2Fb%2F3%2F9dabb00b-609f-4519-9193-dac9575a3953.shields" alt="Server2" width="100" height="20" loading="eager">
          </div>
        </div>
      </div>
    </div>
    
    <a href="#projects" id="scroll-down-container" class="intro-sequence" :ref="setIntroRef" aria-label="Scroll to Projects" v-reveal data-reveal="up" @click="onScrollTo($event, '#projects')">
      <span class="scroll-down-text">Projects</span>
      <i class="fa-solid fa-chevron-down scroll-down-icon"></i>
    </a>
  </section>
</template>

<style scoped>
.discord-avatar-img {
  border-radius: 50%;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.discord-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.discord-guild-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #111214;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #DBDEE1;
  line-height: 1;
}

.guild-badge {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  object-fit: cover;
}

.discord-activity-bubble {
  background: #111214;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 4px 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: 260px;
  position: relative;
}

.discord-activity-bubble::before {
  content: '';
  position: absolute;
  top: 60%;
  right: 100%;
  border-width: 10px 14px 0 0;
  border-style: solid;
  border-color: transparent #111214 transparent transparent;
}

.discord-activity-bubble:not(.spotify-bubble) {
  padding: 6px 10px;
  border-radius: 8px;
}

.discord-activity-bubble:not(.spotify-bubble) .activity-icon {
  width: 36px;
  height: 36px;
}

.discord-activity-bubble:not(.spotify-bubble) .activity-name {
  font-size: 0.85rem;
}

.discord-activity-bubble:not(.spotify-bubble) .activity-details-combined {
  font-size: 0.75rem;
}

.activity-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.activity-text-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  line-height: 1.1;
  min-width: 140px;
}

.activity-text-info > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-name {
  font-weight: bold;
  color: #f2f3f5;
  font-size: 0.75rem;
  margin-bottom: 1px;
}

.activity-details-combined {
  color: #b5bac1;
  font-size: 0.65rem;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}

.marquee-wrapper {
  display: inline-block;
  white-space: nowrap;
}

.marquee-wrapper.is-marquee {
  animation: marquee-scroll 10s linear infinite;
}

.marquee-part {
  display: inline-block;
}

.marquee-wrapper.is-marquee .marquee-part {
  padding-right: 30px;
}

@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.activity-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 4px;
}

.progress-time {
  font-size: 0.6rem;
  color: #b5bac1;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.progress-time.left { text-align: right; }
.progress-time.right { text-align: left; }

.progress-bar {
  flex-grow: 1;
  height: 4px;
  background-color: #4f545c;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  min-width: 60px;
}

.progress-fill {
  height: 100%;
  background-color: #e9ecef;
  border-radius: 2px;
}

.progress-fill.spotify {
  background-color: #1db954;
}

.activity-time-inline {
  margin-left: 4px;
  color: #82858f;
  font-variant-numeric: tabular-nums;
}
</style>