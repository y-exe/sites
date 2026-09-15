<script setup lang="ts">
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

const jiggleIcon = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  target.classList.add('jiggle')
  setTimeout(() => { target.classList.remove('jiggle') }, 500)
}
</script>

<template>
  <section id="about" class="section about-section tw:relative tw:flex tw:min-h-screen tw:w-full tw:max-w-[1200px] tw:flex-col tw:items-center tw:justify-center tw:bg-transparent tw:px-8 tw:py-24 tw:max-md:px-4 tw:max-md:py-20">
    <h2 class="section-title hover-highlight tw:mb-[0.35rem]!" v-split-text>
      <span v-for="(char, i) in `About`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char }}</span>
    </h2>
    <p class="about-subtitle tw:mt-0 tw:mb-8 tw:text-base tw:text-[var(--text-muted-color)]" v-reveal>なんかいろいろ</p>
    <div class="about-container tw:grid tw:w-full tw:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] tw:gap-8">
      <div class="about-card tw:flex tw:flex-col tw:justify-center tw:rounded-2xl tw:border tw:border-[var(--card-border-color)] tw:bg-[var(--card-bg-color)] tw:p-8 tw:text-center tw:shadow-[0_4px_15px_var(--shadow-color)]">
        <NuxtImg 
          src="/icon.webp" 
          alt="y_exe icon" 
          id="about-icon"
          class="tw:mx-auto tw:mb-[0.6rem] tw:size-[100px] tw:rounded-full tw:border-[3px] tw:border-[var(--card-border-color)] tw:transition-transform tw:duration-300 tw:hover:scale-110"
          v-reveal 
          width="100" 
          height="100" 
          format="webp" 
          loading="eager"
          @click="jiggleIcon" 
        />
        <h2 class="section-title hover-highlight tw:mt-0! tw:mb-[0.35rem]! tw:text-[2em]! tw:leading-[1.05]!" v-split-text>
          <span v-for="(char, i) in `Hello, I'm (*'▽')`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char === ' ' ? '&nbsp;' : char }}</span>
        </h2>
        <p class="hover-highlight tw:mt-0 tw:mb-[1.25em] tw:text-[1.1em] tw:leading-[1.35] tw:text-[var(--text-muted-color)]" v-split-text>
          <span v-for="(char, i) in `I am a 16 year old developer-wannabe.`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char === ' ' ? '&nbsp;' : char }}</span>
        </p>
        <div class="info-pills tw:flex tw:flex-wrap tw:justify-center tw:gap-[0.8em]" v-reveal>
          <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-user"></i> He/Him</span>
          <span id="about-time" class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-clock"></i> JST - {{ currentJstTime }}</span>
          <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow,color] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:text-[var(--active-text)] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="fa-solid fa-location-dot"></i> FUKUOKA</span>
        </div>
      </div>
      
      <div class="about-card tw:rounded-2xl tw:border tw:border-[var(--card-border-color)] tw:bg-[var(--card-bg-color)] tw:p-8 tw:text-left tw:shadow-[0_4px_15px_var(--shadow-color)]">
        <div class="tech-category tw:mb-8 last:tw:mb-0" v-reveal>
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'IDEs'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vscode-plain"></i> VSCode</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-intellij-plain"></i> IntelliJ IDEA</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vim-plain"></i> Vim</span>
          </div>
        </div>

        <div class="tech-category tw:mb-8 last:tw:mb-0" v-reveal>
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'Frontend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-typescript-plain"></i> TypeScript</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-javascript-plain"></i> JavaScript</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-vuejs-plain"></i> Vue.js</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nuxtjs-plain"></i> Nuxt.js</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-react-original"></i> React</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nextjs-plain"></i> Next.js</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-astro-plain"></i> Astro</span>
          </div>
        </div>

        <div class="tech-category tw:mb-8 last:tw:mb-0" v-reveal>
          <h3 class="hover-highlight tw:mt-0 tw:mb-[1em] tw:text-base tw:leading-normal tw:font-medium tw:tracking-[1px] tw:text-[var(--text-muted-color)] tw:uppercase" v-split-text><span v-for="(c,i) in 'Backend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills tw:flex tw:flex-wrap tw:gap-[0.8em]">
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-nodejs-plain"></i> Node.js</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-python-plain"></i> Python</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-go-plain"></i> Go</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-java-plain"></i> Java</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-kotlin-plain"></i> Kotlin</span>
            <span class="tw:inline-flex tw:items-center tw:gap-[0.5em] tw:rounded-lg tw:bg-[var(--pill-bg-color)] tw:px-[1em] tw:py-[0.5em] tw:text-[0.9em] tw:font-medium tw:text-[var(--text-muted-color)] tw:transition-[transform,box-shadow] tw:duration-150 tw:ease-[var(--ease-out-expo)] tw:hover:scale-[1.08] tw:hover:shadow-[0_6px_15px_var(--shadow-hover-color)]"><i class="devicon-postgresql-plain"></i> PostgreSQL</span>
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
