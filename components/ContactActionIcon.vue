<script setup lang="ts">
defineProps<{ name: 'mail' | 'more' }>()
</script>
<template>
  <span class="contact-action-icon" aria-hidden="true">
    <svg v-if="name === 'mail'" viewBox="0 0 512 512" fill="currentColor" focusable="false">
      <rect class="solid-mail-letter" x="128" y="128" width="256" height="224" rx="24"/>
      <path class="solid-mail-body" d="M0 176V384c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176Z"/>
      <path class="solid-mail-flap" d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48Z"/>
    </svg>
    <svg v-else class="solid-more" viewBox="0 0 448 512" fill="currentColor" focusable="false"><circle cx="64" cy="256" r="56"/><circle cx="224" cy="256" r="56"/><circle cx="384" cy="256" r="56"/></svg>
  </span>
</template>
