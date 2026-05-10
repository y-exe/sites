<template>
  <NuxtPage />
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.intro-sequence {
  opacity: 0;
  transform: translateY(60px);
  transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1), transform 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.intro-sequence[data-reveal="down"] {
  transform: translateY(-60px);
}

.intro-sequence.is-visible {
  opacity: 1;
  transform: translateY(0);
}

[data-split-text]:not(.is-visible) .char {
  opacity: 0;
  transform: translateY(100%);
}
</style>