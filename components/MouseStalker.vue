<script setup lang="ts">
const { x, y } = useMouse()

const stalker1 = ref({ x: 0, y: 0 })
const stalker2 = ref({ x: 0, y: 0 })
const stalker3 = ref({ x: 0, y: 0 })

const updateStalker = () => {
  stalker1.value.x += (x.value - stalker1.value.x) * 0.2
  stalker1.value.y += (y.value - stalker1.value.y) * 0.2
  
  stalker2.value.x += (x.value - stalker2.value.x) * 0.1
  stalker2.value.y += (y.value - stalker2.value.y) * 0.1
  
  stalker3.value.x += (x.value - stalker3.value.x) * 0.05
  stalker3.value.y += (y.value - stalker3.value.y) * 0.05

  requestAnimationFrame(updateStalker)
}

onMounted(() => {
  updateStalker()
})
</script>

<template>
  <ClientOnly>
    <div class="stalker-wrapper">
      <div class="stalker" :style="{ transform: `translate(${stalker1.x}px, ${stalker1.y}px) translate(-50%, -50%)` }"></div>
      <div class="stalker" :style="{ transform: `translate(${stalker2.x}px, ${stalker2.y}px) translate(-50%, -50%)` }"></div>
      <div class="stalker" :style="{ transform: `translate(${stalker3.x}px, ${stalker3.y}px) translate(-50%, -50%)` }"></div>
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