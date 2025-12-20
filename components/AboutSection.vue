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
  <section id="about" class="section about-section">
    <div class="about-container">
      <div class="about-card">
        <NuxtImg src="/icon.webp" alt="y_exe icon" id="about-icon" v-reveal width="100" height="100" format="webp" @click="jiggleIcon" />
        <h2 class="section-title hover-highlight" v-split-text>
          <span v-for="(char, i) in `Hello, I'm (*'▽')`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char === ' ' ? '&nbsp;' : char }}</span>
        </h2>
        <p class="hover-highlight" v-split-text>
          <span v-for="(char, i) in `I am a 16 year old developer-wannabe.`.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{ char === ' ' ? '&nbsp;' : char }}</span>
        </p>
        <div class="info-pills" v-reveal>
          <span><i class="fa-solid fa-user"></i> He/Him</span>
          <span id="about-time"><i class="fa-solid fa-clock"></i> JST - {{ currentJstTime }}</span>
          <span><i class="fa-solid fa-location-dot"></i> JAPAN</span>
        </div>
      </div>
      <div class="about-card">
        <div class="tech-category" v-reveal>
          <h3 class="hover-highlight" v-split-text><span v-for="(c,i) in 'IDEs'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills">
            <span><i class="fa-solid fa-code"></i> VSCode</span>
            <span><i class="fa-solid fa-code"></i> IntelliJ IDEA</span>
          </div>
        </div>
        <div class="tech-category" v-reveal>
          <h3 class="hover-highlight" v-split-text><span v-for="(c,i) in 'Backend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills">
            <span><i class="fa-brands fa-python"></i> Python</span>
            <span><i class="fa-brands fa-java"></i> Java</span>
            <span><i class="fa-solid fa-k"></i> Kotlin</span>
            <span><i class="fa-brands fa-js"></i> TypeScript</span>
            <span><i class="fa-brands fa-js"></i> JavaScript</span>
            <span><i class="fa-brands fa-node-js"></i> Node.js</span>
          </div>
        </div>
        <div class="tech-category" v-reveal>
          <h3 class="hover-highlight" v-split-text><span v-for="(c,i) in 'Frontend'.split('')" :key="i" class="char" :style="`--char-delay: ${i*50}ms`">{{c}}</span></h3>
          <div class="tech-pills">
            <span><i class="fa-brands fa-js"></i> TypeScript</span>
            <span><i class="fa-brands fa-js"></i> JavaScript</span>
            <span><i class="fa-solid fa-code"></i> Nuxt.js</span>
          </div>
        </div>
      </div>
    </div>
    <footer class="footer">
      <p class="footer-logo" v-reveal>yexe.net</p>
      <p class="footer-copyright" v-reveal>Copyright © 2025 yexe</p>
    </footer>
  </section>
</template>