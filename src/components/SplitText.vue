<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    default: 'span'
  },
  className: {
    type: String,
    default: ''
  }
});

const container = ref(null);
const isVisible = ref(false);

onMounted(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      isVisible.value = true;
      observer.disconnect();
    }
  }, { threshold: 0.2 });

  if (container.value) {
    observer.observe(container.value);
  }
});
</script>

<template>
  <component 
    :is="tag" 
    ref="container" 
    :class="['split-text-container', className, { 'is-visible': isVisible }]"
  >
    <span 
      v-for="(char, index) in text" 
      :key="index" 
      class="char" 
      :style="{ '--char-delay': (index * 50) + 'ms' }"
    >
      {{ char === ' ' ? '&nbsp;' : char }}
    </span>
  </component>
</template>

<style scoped>

.split-text-container {
  display: inline-block;
}
</style>