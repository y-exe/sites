<!-- components/MouseStalker.vue -->
<script setup lang="ts">
const { x, y } = useMouse()

const stalkers = [
  ref({ x: 0, y: 0 }),
  ref({ x: 0, y: 0 }),
  ref({ x: 0, y: 0 })
]

const speeds = [0.4, 0.25, 0.1]

const updateStalker = () => {
  const targetX = x.value
  const targetY = y.value
  
  for (let i = 0; i < stalkers.length; i++) {
    const stalker = stalkers[i].value
    const speed = speeds[i]
    
    stalker.x += (targetX - stalker.x) * speed
    stalker.y += (targetY - stalker.y) * speed
  }

  requestAnimationFrame(updateStalker)
}

onMounted(() => {
  updateStalker()
})
</script>

<template>
  <ClientOnly>
    <div class="stalker-wrapper">
      <div 
        v-for="(stalker, index) in stalkers" 
        :key="index"
        class="stalker" 
        :style="{ transform: `translate(${stalker.value.x}px, ${stalker.value.y}px) translate(-50%, -50%)` }"
      ></div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.stalker {
  position: fixed;
  top: 0;
  left: 0;
  width: 15px;
  height: 15px;
  background-color: var(--active-text);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.3;
  will-change: transform;
}
.stalker:nth-of-type(1) { opacity: 0.3; }
.stalker:nth-of-type(2) { opacity: 0.2; }
.stalker:nth-of-type(3) { opacity: 0.1; }

@media (hover: none) { .stalker-wrapper { display: none; } }
</style>