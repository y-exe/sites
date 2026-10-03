<script setup lang="ts">
import { createSpring } from '~/utils/spring'
const props = defineProps<{
  setIntroRef?: (el: any) => void
}>()

const now = useNow()

const currentJstTime = computed(() => {
  const timeString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',  
    minute: '2-digit',
    hour12: true 
  }).format(now.value)
  
  return timeString 
})

const avatar = ref<HTMLElement | null>(null)
const greeting = ref<HTMLElement | null>(null)
const waveTimers: ReturnType<typeof setTimeout>[] = []
const letterSprings = new Map<HTMLElement, ReturnType<typeof createSpring<'lift' | 'tilt'>>>()
let avatarSpring: ReturnType<typeof createSpring<'lift' | 'tilt' | 'squash'>> | undefined
let clickDirection = 1
const springFor = (letter: HTMLElement) => {
  let spring = letterSprings.get(letter)
  if (!spring) {
    spring = createSpring({ lift: 0, tilt: 0 }, ({ lift, tilt }) => {
      letter.style.transform = `translateY(${lift}px) rotate(${tilt}deg)`
    }, { stiffness: 240, damping: 13 })
    letterSprings.set(letter, spring)
  }
  return spring
}
const jiggleIcon = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  clickDirection *= -1
  avatarSpring?.to({ lift: 0, tilt: 0, squash: 0 })
  avatarSpring?.kick({ lift: -430, tilt: 280 * clickDirection, squash: 1.6 })
  replayGreeting()
}
const replayGreeting = () => {
  waveTimers.forEach(clearTimeout); waveTimers.length = 0
  greeting.value?.querySelectorAll<HTMLElement>('.greeting-letter').forEach((letter, index) => {
    waveTimers.push(setTimeout(() => {
      springFor(letter).to({ lift: 0, tilt: 0 })
      springFor(letter).kick({ lift: -245, tilt: index % 2 ? 80 : -80 })
    }, index * 34))
  })
}
const followLetters = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  greeting.value?.querySelectorAll<HTMLElement>('.greeting-letter').forEach(letter => {
    const rect = letter.parentElement!.getBoundingClientRect()
    const distance = event.clientX - (rect.left + rect.width / 2)
    const strength = Math.max(0, 1 - Math.abs(distance) / 85)
    springFor(letter).to({ lift: -18 * strength, tilt: distance / 7 * strength })
  })
}
const resetLetters = () => letterSprings.forEach(spring => spring.to({ lift: 0, tilt: 0 }))
const followAvatar = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || !avatar.value || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const bounds = avatar.value.getBoundingClientRect()
  avatarSpring?.to({ tilt: (event.clientX - bounds.left - bounds.width / 2) / 6, lift: -5 })
}
onMounted(() => {
  avatarSpring = createSpring({ lift: 0, tilt: 0, squash: 0 }, ({ lift, tilt, squash }) => {
    const image = avatar.value?.querySelector('img')
    if (image) image.style.transform = `translateY(${lift}px) rotate(${tilt}deg) scale(${1 + squash}, ${1 - squash * .65})`
  }, { stiffness: 200, damping: 12 })
})
onUnmounted(() => { waveTimers.forEach(clearTimeout); avatarSpring?.stop(); letterSprings.forEach(spring => spring.stop()) })
</script>

<template>
  <section id="about" class="section about-section tw:relative tw:flex tw:min-h-screen tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-center tw:justify-center tw:bg-transparent tw:px-8 tw:py-24 tw:max-md:px-4 tw:max-md:py-20">
    <h2 class="section-title hover-highlight tw:mb-[0.35rem]!" v-split-text>
      <span v-for="(char, i) in `About`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <p class="about-subtitle hover-highlight tw:mt-0 tw:mb-8 tw:text-base tw:text-[var(--text-muted-color)]" v-reveal>なんかいろいろ</p>
    <div class="about-container tw:grid tw:w-full tw:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] tw:gap-8">
      <div class="about-card tw:flex tw:flex-col tw:justify-center tw:rounded-2xl tw:border tw:border-[var(--card-border-color)] tw:bg-[var(--card-bg-color)] tw:p-8 tw:text-center tw:shadow-[0_4px_15px_var(--shadow-color)]">
        <button ref="avatar" class="about-avatar-action" type="button" aria-label="アイコンを揺らす" @pointermove="followAvatar" @pointerleave="avatarSpring?.to({ tilt: 0, lift: 0 })" @click="jiggleIcon">
        <NuxtImg 
          src="/icon.webp" 
          alt="y_exe icon" 
          id="about-icon"
          class="tw:mx-auto tw:mb-[0.6rem] tw:size-[100px] tw:rounded-full tw:border-[3px] tw:border-[var(--card-border-color)] tw:transition-transform tw:duration-300 tw:hover:scale-110"
          v-reveal 
          width="132"
          height="132"
          format="webp" 
          loading="eager"

        />
        </button>
        <h2 ref="greeting" class="about-greeting section-title hover-highlight tw:mt-0! tw:mb-[0.35rem]! tw:w-fit tw:max-w-full tw:self-center tw:text-[2em]! tw:leading-[1.05]!" @pointermove="followLetters" @pointerleave="resetLetters" v-split-text>
          <span v-for="(char, i) in `Hello, I'm (*'▽')`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`"><span class="greeting-letter">{{ char === ' ' ? '\u00a0' : char }}</span></span>
        </h2>
        <p class="about-description hover-highlight tw:mt-0 tw:mb-[1.25em] tw:max-w-full tw:self-center tw:text-base tw:leading-[1.5] tw:text-[var(--text-muted-color)]" v-reveal>I am a 16 year old developer-wannabe.</p>
        <div class="info-pills tw:flex tw:flex-wrap tw:justify-center tw:gap-[0.8em]">
          <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-user"></i> He/Him</span>
          <span v-reveal id="about-time" class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-clock"></i> JST - {{ currentJstTime }}</span>
          <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-location-dot"></i> FUKUOKA</span>
        </div>
      </div>
      
      <div class="about-card tw:rounded-2xl tw:border tw:border-[var(--card-border-color)] tw:bg-[var(--card-bg-color)] tw:p-8 tw:text-left tw:shadow-[0_4px_15px_var(--shadow-color)]">
        <div class="tech-category tw:mb-8 last:tw:mb-0">
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'IDEs'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vscode-plain"></i> VSCode</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-intellij-plain"></i> IntelliJ IDEA</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vim-plain"></i> Vim</span>
          </div>
        </div>

        <div class="tech-category tw:mb-8 last:tw:mb-0">
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'Frontend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-typescript-plain"></i> TypeScript</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-javascript-plain"></i> JavaScript</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vuejs-plain"></i> Vue.js</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nuxtjs-plain"></i> Nuxt.js</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-react-original"></i> React</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nextjs-plain"></i> Next.js</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-astro-plain"></i> Astro</span>
          </div>
        </div>

        <div class="tech-category tw:mb-8 last:tw:mb-0">
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'Backend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nodejs-plain"></i> Node.js</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-python-plain"></i> Python</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-go-plain"></i> Go</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-java-plain"></i> Java</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-kotlin-plain"></i> Kotlin</span>
            <span v-reveal class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-postgresql-plain"></i> PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
    <footer class="footer tw:mt-8 tw:pb-8 tw:text-center tw:[font-family:var(--font-display)] tw:text-[var(--text-muted-color)]">
      <p class="footer-logo tw:m-0 tw:text-2xl tw:font-bold tw:text-[var(--active-text)]" v-reveal>yexe.net</p>
      <p class="footer-copyright tw:mt-2 tw:mb-0 tw:text-[0.9em]" v-reveal>Copyright © 2026 yexe</p>
    </footer>
  </section>
</template>
