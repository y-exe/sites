<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}>()

useHead({
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap' }
  ]
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const dinoEl = ref<HTMLImageElement | null>(null)
const isNight = ref(false)
let animId = 0
let cleanup: (() => void) | null = null

onMounted(() => {
  const canvas = canvasEl.value!
  const dinoImg = dinoEl.value!
  const ctx = canvas.getContext('2d')!

  const W = 800
  const H = 300
  const GROUND = 248
  const DINO_X = 100
  const DINO_W_RUN = 48
  const DINO_H_RUN = 85
  const DINO_W_JUMP = 85
  const DINO_H_JUMP = 85
  const GRAVITY = 0.85
  const JUMP_VY = -20
  const TILE_W = 880

  const spriteUrls = {
    run: '/game/1.png',
    jump: '/game/2.png',
    dead: '/game/3.png'
  }

  const obstacleVideo = document.createElement('video')
  obstacleVideo.src = '/game/4.mp4'
  obstacleVideo.loop = true
  obstacleVideo.muted = true
  obstacleVideo.playsinline = true
  obstacleVideo.style.display = 'none'
  document.body.appendChild(obstacleVideo)

  let videoPlaying = false
  const startVideo = () => {
    if (!videoPlaying) {
      videoPlaying = true
      obstacleVideo.play().catch(() => {})
    }
  }

  const obstacleImg = new Image()
  obstacleImg.src = '/game/5.png'

  const videoProcessCanvas = document.createElement('canvas')
  videoProcessCanvas.width = 120
  videoProcessCanvas.height = 120
  const videoProcessCtx = videoProcessCanvas.getContext('2d')!

  let hiScore = parseInt(localStorage.getItem('404-dino-hi') || '0')

  const DINO_W = DINO_W_RUN
  const DINO_H = DINO_H_RUN

  type State = 'idle' | 'running' | 'dead'
  let state: State = 'idle'
  let dinoY = GROUND - DINO_H
  let dinoVY = 0
  let jumping = false
  let speed = 5
  let rawScore = 0
  let frame = 0
  let nightMode = false
  let groundOff = 0
  let nextObstTimer = 90
  let landingFrameCount = 0

  type Obstacle = { x: number; h: number; useVideo: boolean }
  let obstacles: Obstacle[] = []

  const groundDots: Array<{ ox: number; dy: number; dw: number; dh: number }> = []
  const rng = (seed: number) => {
    let s = seed
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  }
  const rand = rng(42)
  for (let i = 0; i < 120; i++) {
    groundDots.push({
      ox: i * 7.5 + rand() * 3,
      dy: 3 + rand() * 7,
      dw: 1 + rand() * 2,
      dh: 1 + rand() * 2,
    })
  }

  const resetGame = () => {
    state = 'running'
    dinoY = GROUND - DINO_H
    dinoVY = 0
    jumping = false
    speed = 5
    rawScore = 0
    frame = 0
    nightMode = false
    isNight.value = false
    obstacles = []
    nextObstTimer = 90
    groundOff = 0
    startVideo()
  }

  const handleInput = (e: Event) => {
    if (e instanceof KeyboardEvent) {
      if (e.code !== 'Space' && e.code !== 'ArrowUp') return
      e.preventDefault()
    }
    if (e instanceof TouchEvent) e.preventDefault()
    if (state === 'idle') { resetGame(); return }
    if (state === 'dead') { resetGame(); return }
    if (!jumping) {
      dinoVY = JUMP_VY
      jumping = true
    }
  }

  window.addEventListener('keydown', handleInput)
  canvas.addEventListener('click', handleInput)
  canvas.addEventListener('touchstart', handleInput, { passive: false })

  const spawnObstacle = () => {
    const heights = [60, 80, 100]
    const h = heights[Math.floor(Math.random() * heights.length)]
    obstacles.push({ x: W + 30, h, useVideo: true })
  }

  const drawObstacle = (o: Obstacle, useVideo: boolean) => {
    const w = o.h

    if (videoPlaying && obstacleVideo.readyState >= 2) {
      videoProcessCtx.clearRect(0, 0, 120, 120)
      videoProcessCtx.drawImage(obstacleVideo, 0, 0, 120, 120)

      const imgData = videoProcessCtx.getImageData(0, 0, 120, 120)
      const data = imgData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (g > 180 && r < 80 && b < 80) {
          data[i + 3] = 0
        }
      }
      videoProcessCtx.putImageData(imgData, 0, 0)
      ctx.drawImage(videoProcessCanvas, 0, 0, 120, 120, o.x, GROUND - o.h, w, o.h)
    } else {
      ctx.fillStyle = '#888'
      ctx.fillRect(o.x, GROUND - o.h, w, o.h)
    }
  }

  const checkCollision = () => {
    const pad = 10
    const dx = DINO_X + pad
    const dw = DINO_W - pad * 2
    const dy = dinoY + pad
    const dh = DINO_H - pad
    for (const o of obstacles) {
      const w = o.h
      const margin = o.useVideo ? 8 : 0

      const collisionX = o.x + margin
      const collisionW = w - margin * 2
      const collisionH = o.h
      const collisionY = GROUND - collisionH

      if (
        dx < collisionX + collisionW - 2 &&
        dx + dw > collisionX + 2 &&
        dy + dh > collisionY + 4
      ) return true
    }
    return false
  }

  const updateDinoSprite = () => {
    let src = spriteUrls.dead
    let displayW = DINO_W_JUMP
    let displayH = DINO_H_JUMP

    if (state === 'running') {
      src = jumping ? spriteUrls.jump : spriteUrls.run
      if (!jumping) {
        displayW = DINO_W_RUN
        displayH = DINO_H_RUN
      }
    }

    if (dinoImg.src !== location.origin + src) dinoImg.src = src
    dinoImg.style.left   = (DINO_X / W * 100) + '%'
    dinoImg.style.top    = (dinoY  / H * 100) + '%'
    dinoImg.style.width  = (displayW / W * 100) + '%'
    dinoImg.style.height = (displayH / H * 100) + '%'
  }

  const loop = () => {
    ctx.fillStyle = nightMode ? '#1a1a1a' : '#ffffff'
    ctx.fillRect(0, 0, W, H)

    if (state === 'running') {
      frame++
      speed = Math.min(13, 5 + frame * 0.0015)
      rawScore += speed / 10
      const intScore = Math.floor(rawScore)

      const shouldBeNight = Math.floor(intScore / 700) % 2 === 1
      if (shouldBeNight !== nightMode) {
        nightMode = shouldBeNight
        isNight.value = nightMode
      }

      groundOff = (groundOff + speed) % TILE_W

      if (jumping) {
        dinoVY += GRAVITY
        dinoY += dinoVY
        if (dinoY >= GROUND - DINO_H) {
          dinoY = GROUND - DINO_H
          dinoVY = 0
          jumping = false
          landingFrameCount = 8
        }
      }

      nextObstTimer--
      if (nextObstTimer <= 0) {
        spawnObstacle()
        const minGap = Math.max(35, 70 - Math.floor(frame / 400) * 8)
        nextObstTimer = minGap + Math.random() * 55
      }
      for (const o of obstacles) o.x -= speed
      obstacles = obstacles.filter(o => o.x + o.h > 0)

      if (checkCollision()) {
        state = 'dead'
        if (Math.floor(rawScore) > hiScore) {
          hiScore = Math.floor(rawScore)
          localStorage.setItem('404-dino-hi', String(hiScore))
        }
      }
    }

    ctx.strokeStyle = nightMode ? '#4A7BA7' : '#42C4D9'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, GROUND)
    for (let x = 0; x <= W; x += 5) {
      let y = GROUND
      if (landingFrameCount > 0) {
        const dino_center = DINO_X + DINO_W / 2
        const dist = Math.abs(x - dino_center)
        const progress = 1 - (landingFrameCount / 12)

        if (dist < 80) {
          const mainDepth = Math.sin(Math.PI - progress * Math.PI) * 5 * (1 - dist / 80)
          const bounceWave = Math.sin(progress * Math.PI * 2) * 1 * (1 - dist / 80)
          y += mainDepth + bounceWave
        }
      }
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    for (const o of obstacles) drawObstacle(o, o.useVideo)

    updateDinoSprite()

    const textColor = nightMode ? '#9e9e9e' : '#535353'
    ctx.fillStyle = textColor
    ctx.font = '14px "Press Start 2P", monospace'
    ctx.textAlign = 'right'
    const sc = String(Math.floor(rawScore)).padStart(5, '0')
    const hi = String(hiScore).padStart(5, '0')
    ctx.fillText(`HI ${hi}  ${sc}`, W - 10, 28)

    if (state === 'idle') {
      ctx.fillStyle = textColor
      ctx.font = '13px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PRESS SPACE OR CLICK TO START', W / 2, GROUND - 70)
    }

    if (state === 'dead') {
      ctx.fillStyle = textColor
      ctx.font = '18px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', W / 2, 60)
      ctx.font = '13px "Press Start 2P", monospace'
      ctx.fillText('RETRY', W / 2, 85)
    }

    if (landingFrameCount > 0) landingFrameCount--

    animId = requestAnimationFrame(loop)
  }

  animId = requestAnimationFrame(loop)

  cleanup = () => {
    window.removeEventListener('keydown', handleInput)
    canvas.removeEventListener('click', handleInput)
    canvas.removeEventListener('touchstart', handleInput)
    cancelAnimationFrame(animId)
  }
})

onUnmounted(() => cleanup?.())
</script>

<template>
  <div :class="['page-404', { night: isNight }]">
    <div class="content-wrap">
      <div class="game-container">
        <canvas ref="canvasEl" width="800" height="300" />
        <!-- img は % 指定で JS から配置するため CSS の dino-sprite に size 指定なし -->
        <img ref="dinoEl" alt="" class="dino-sprite" />
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
  background: #ffffff;
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

/* CSS の max-width でゲーム画面全体サイズを制御 */
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
}

/* サイズ・位置は JS が % で設定するため CSS では指定しない */
.dino-sprite {
  position: absolute;
  image-rendering: auto;
  pointer-events: none;
}

.err-body {
  margin-top: 4px;
  color: #535353;
  transition: color 0.5s ease;
}

.page-404.night .err-body {
  color: #9e9e9e;
}

h1 {
  font-size: 24px;
  font-weight: 400;
  margin: 0 0 12px;
  color: #000000;
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
  color: #535353;
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
