<script setup lang="ts">
import { createRunnerGame, RUNNER, type RunnerEvent, type RunnerState } from '~/utils/runner-game'
import { createRunnerPose } from '~/utils/runner-pose'

const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()
useHead({ title: `${props.error.statusCode || 404} | yexe.net`, link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap' }] })
const canvasEl = ref<HTMLCanvasElement | null>(null)
const dinoEl = ref<HTMLImageElement | null>(null)
const jumpEl = ref<HTMLImageElement | null>(null)
const state = ref<RunnerState>('ready'), score = ref(0), best = ref(0), night = ref(false)
const reduced = usePreferredReducedMotion()
const { isDarkMode } = useSiteTheme()
let input = () => {}, pause = () => {}, cleanup = () => {}
onMounted(() => {
  const canvas = canvasEl.value!, dino = dinoEl.value!, jumpingSprite = jumpEl.value!, ctx = canvas.getContext('2d')
  if (!ctx) return
  try { best.value = Math.max(0, Number(localStorage.getItem('404-dino-hi')) || 0) } catch {}
  const video = document.createElement('video')
  video.src = '/game/4.mp4'; video.loop = true; video.muted = true; video.playsInline = true; video.preload = 'auto'
  const processed = document.createElement('canvas'); processed.width = processed.height = 120
  const processCtx = processed.getContext('2d', { willReadFrequently: true })!
  let frameId = 0, previous = 0, videoAge = 1, videoReady = false, landAge = 1, deadAge = 1
  const pose = createRunnerPose()
  const event = (event: RunnerEvent) => {
    if (event === 'jump') pose.launch()
    if (event === 'land') {
      landAge = 0
      pose.land()
    }
    if (event === 'dead') {
      deadAge = 0; video.pause()
      if (Math.floor(runner.game.score) > best.value) {
        best.value = Math.floor(runner.game.score)
        try { localStorage.setItem('404-dino-hi', String(best.value)) } catch {}
      }
    }
  }
  const runner = createRunnerGame(Math.random, event)
  const startVideo = () => { void video.play().catch(() => {}) }
  input = () => {
    if (runner.game.state === 'dead' && deadAge < .35) return
    if (runner.game.state === 'paused') { pause(); return }
    const restarting = runner.game.state !== 'running'
    if (restarting) { landAge = 1; pose.reset() }
    runner.input(); state.value = runner.game.state; startVideo()
  }
  pause = () => {
    runner.pause(); state.value = runner.game.state; previous = 0
    if (state.value === 'paused') video.pause()
    else if (state.value === 'running') startVideo()
  }
  const key = (e: KeyboardEvent) => {
    if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable="true"]')) return
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if ((e.target as HTMLElement)?.closest('button, a')) return
      e.preventDefault(); input()
    }
  }
  const visibility = () => {
    if (document.visibilityState !== 'visible' && runner.game.state === 'running') pause()
  }
  const blur = () => { if (runner.game.state === 'running') pause() }
  const paint = (time: number) => {
    const dt = previous ? Math.min((time - previous) / 1000, .1) : 0; previous = time
    runner.advance(dt)
    const g = runner.game
    state.value = g.state; score.value = Math.floor(g.score)
    night.value = Math.floor(g.score / 700) % 2 === 1
    landAge += dt; deadAge += dt; videoAge += dt
    const dark = night.value || isDarkMode.value
    ctx.clearRect(0, 0, 800, 300)
    const jumpHeight = Math.max(0, RUNNER.ground - RUNNER.heightRun - g.y)
    ctx.fillStyle = dark ? '#9ba9b6' : '#78878d'; ctx.globalAlpha = .13 - Math.min(.08, jumpHeight / 180 * .08)
    ctx.beginPath(); ctx.ellipse(124, RUNNER.ground - 1, 22 - Math.min(12, jumpHeight / 180 * 12), 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1
    ctx.strokeStyle = dark ? '#6797b8' : '#42b9ca'; ctx.lineWidth = 2
    const bounce = reduced.value ? 0 : Math.sin(landAge * 24) * Math.exp(-landAge * 10) * 8
    ctx.beginPath()
    for (let x = 0; x <= 800; x += 4) {
      const y = RUNNER.ground + bounce * Math.max(0, 1 - Math.abs(x - 124) / 80)
      if (!x) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = dark ? '#657080' : '#b3bbc4'
    for (let i = 0; i < 100; i++) {
      const x = ((i * 31 + (i % 3) * 7 - g.groundOffset) % 880 + 880) % 880
      ctx.fillRect(x, RUNNER.ground + 5 + i % 8, 2 + i % 3, 1)
    }
    if (video.readyState >= 2 && videoAge >= 1 / 30) {
      videoAge = 0
      processCtx.drawImage(video, 0, 0, 120, 120)
      const pixels = processCtx.getImageData(0, 0, 120, 120)
      for (let i = 0; i < pixels.data.length; i += 4) if (pixels.data[i + 1]! > 180 && pixels.data[i]! < 80 && pixels.data[i + 2]! < 80) pixels.data[i + 3] = 0
      processCtx.putImageData(pixels, 0, 0); videoReady = true
    }
    for (const obstacle of g.obstacles) {
      if (videoReady) ctx.drawImage(processed, obstacle.x, RUNNER.ground - obstacle.size, obstacle.size, obstacle.size)
      else { ctx.fillStyle = '#818994'; ctx.fillRect(obstacle.x + 8, RUNNER.ground - obstacle.size, obstacle.size - 16, obstacle.size) }
    }
    ctx.fillStyle = dark ? '#9e9e9e' : '#535353'
    ctx.font = '14px "Press Start 2P", monospace'; ctx.textAlign = 'right'
    ctx.fillText(`HI ${String(best.value).padStart(5, '0')}  ${String(score.value).padStart(5, '0')}`, 790, 28)
    if (g.state !== 'running') {
      ctx.textAlign = 'center'
      ctx.font = `${g.state === 'ready' ? 13 : 18}px "Press Start 2P", monospace`
      ctx.fillText(g.state === 'ready' ? 'PRESS SPACE OR CLICK TO START' : g.state === 'paused' ? 'PAUSED' : 'GAME OVER', 400, g.state === 'ready' ? RUNNER.ground - 70 : 60)
      if (g.state !== 'ready') {
        ctx.font = '13px "Press Start 2P", monospace'
        ctx.fillText(g.state === 'paused' ? 'SPACE OR CLICK TO RESUME' : 'RETRY', 400, 85)
      }
    }
    const src = g.state === 'dead' ? '/game/3.png' : '/game/1.png'
    if (dino.getAttribute('src') !== src) dino.src = src
    const visual = pose.advance(g.state === 'paused' ? 0 : dt, g.jumping && g.state !== 'dead', g.velocity, reduced.value)
    const wide = g.state === 'dead'
    dino.style.left = `${(124 - (wide ? 42.5 : 24)) / 8}%`; dino.style.top = `${g.y / 3}%`; dino.style.width = `${(wide ? 85 : 48) / 8}%`; dino.style.height = `${85 / 3}%`
    jumpingSprite.style.left = `${(124 - 85 * .44) / 8}%`; jumpingSprite.style.top = `${g.y / 3}%`; jumpingSprite.style.width = `${85 / 8}%`; jumpingSprite.style.height = `${85 / 3}%`
    dino.style.opacity = String(1 - visual.blend); jumpingSprite.style.opacity = String(visual.blend)
    for (const sprite of [dino, jumpingSprite]) sprite.style.transform = `rotate(${visual.angle}deg) scale(${visual.x},${visual.y})`
    frameId = requestAnimationFrame(paint)
  }
  window.addEventListener('keydown', key); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility)
  frameId = requestAnimationFrame(paint)
  cleanup = () => {
    cancelAnimationFrame(frameId); window.removeEventListener('keydown', key); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility)
    video.pause(); video.removeAttribute('src'); video.load()
  }
})
onUnmounted(() => cleanup())
</script>

<template>
  <div :class="['page-404', { night: night }]">
    <div class="content-wrap">
      <div class="game-container">
        <canvas ref="canvasEl" width="800" height="300" tabindex="0" role="button" :data-game-state="state" aria-label="ゲームを開始、またはジャンプ" @pointerdown.prevent="$event.button === 0 && input()" />
        <img ref="dinoEl" src="/game/1.png" alt="" class="dino-sprite" /><img ref="jumpEl" src="/game/2.png" alt="" class="dino-sprite jump-sprite" />
      </div>
      <div class="err-body">
        <h1>このページは存在しません</h1>
        <p class="err-sub">次をお試しください</p>
        <ul>
          <li>spaceを押してゲームを開始する！</li>
          <li>URLを見直す</li>
          <li><a href="/">トップページに戻る</a></li>
        </ul>
        <p class="err-code">404_NOT_FOUND</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.page-404 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: var(--active-bg);
  transition: background 0.5s ease;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  padding: 40px 20px 20px;
}

.page-404.night {
  background: #1a1a1a;
}

.content-wrap {
  width: 100%;
  max-width: 660px;
  text-align: left;
}

.game-container {
  position: relative;
  width: 100%;
  aspect-ratio: 800 / 300;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  touch-action: manipulation;
}

.dino-sprite {
  position: absolute;
  image-rendering: auto;
  pointer-events: none;
  transform-origin: 50% 100%;
}
.jump-sprite { opacity: 0; transform-origin: 44% 100%; }

.err-body {
  margin-top: 4px;
  color: var(--text-muted-color);
  transition: color 0.5s ease;
}

.page-404.night .err-body {
  color: #9e9e9e;
}

h1 {
  font-size: 24px;
  font-weight: 400;
  margin: 0 0 12px;
  color: var(--active-text);
  transition: color 0.5s ease;
}

.page-404.night h1 {
  color: #9e9e9e;
}

.err-sub {
  font-size: 15px;
  margin: 0 0 8px;
}

ul {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 15px;
}

ul li {
  color: var(--text-muted-color);
  margin-bottom: 4px;
}

.page-404.night ul li {
  color: #9e9e9e;
}

ul li a {
  color: #1a73e8;
  text-decoration: none;
}

.page-404.night ul li a {
  color: #8ab4f8;
}

ul li a:hover {
  text-decoration: underline;
}

.err-code {
  color: #999999;
  font-size: 14px;
  margin: 10px 0 0;
  font-family: 'Courier New', monospace;
}

.page-404.night .err-code {
  color: #666666;
}
</style>
