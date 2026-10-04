<script setup lang="ts">
import AnimatedIconShape from '~/components/AnimatedIconShape.vue'
defineProps<{ name: 'image' | 'link' | 'alert' | 'search' | 'zoom-in' | 'zoom-out' | 'eye' | 'arrow' | 'up' | 'download' | 'chevron' | 'close' | 'copy' | 'check' | 'external' | 'expand' | 'sun' | 'moon' | 'monitor' | 'clock' | 'user' | 'pin' | 'star' | 'fork' | 'code' | 'play' | 'pause' | 'replay' | 'mail' | 'more'; size?: number; expanded?: boolean; checked?: boolean }>()
</script>
<template>
  <svg class="site-icon" :class="`icon-${name}`" :width="size || 20" :height="size || 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <g v-if="name === 'image'"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></g>
    <g v-else-if="name === 'alert'"><circle cx="12" cy="12" r="9"/><path d="M12 7v5m0 4v.01"/></g>
    <g v-else-if="name === 'search'"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></g>
    <g v-else-if="name === 'zoom-in' || name === 'zoom-out'"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5M7 10h6"/><path v-if="name === 'zoom-in'" d="M10 7v6"/></g>
    <g v-else-if="name === 'eye'" class="eye-shape"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle class="eye-pupil" cx="12" cy="12" r="3"/></g>
    <g v-else-if="name === 'arrow'"><path d="M4 12h15"/><path class="icon-tip" d="m13 5 7 7-7 7"/></g>
    <g v-else-if="name === 'up'"><path d="M12 20V4"/><path d="m5 11 7-7 7 7"/></g>
    <g v-else-if="name === 'download'"><g class="download-arrow"><path d="M12 3v12m-5-5 5 5 5-5"/></g><path d="M4 16v4h16v-4"/></g>
    <AnimatedIconShape v-else-if="name === 'chevron'" kind="chevron" :active="!!expanded"/>
    <g v-else-if="name === 'close'"><path d="m6 6 12 12M18 6 6 18"/></g>
    <AnimatedIconShape v-else-if="name === 'copy' || name === 'check'" kind="copy" :active="name === 'check'"/>
    <AnimatedIconShape v-else-if="name === 'link'" kind="link" :active="!!checked"/>
    <g v-else-if="name === 'external'"><path d="M14 4h6v6m0-6-9 9"/><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></g>
    <path v-else-if="name === 'expand'" d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>
    <g v-else-if="name === 'sun'"><circle cx="12" cy="12" r="4"/><g class="sun-rays"><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></g></g>
    <path v-else-if="name === 'moon'" d="M20.5 13.4A8.7 8.7 0 0 1 10.6 3.5 8.7 8.7 0 1 0 20.5 13.4Z"/>
    <g v-else-if="name === 'monitor'"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4m-4 0h8"/></g>
    <g v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>
    <g v-else-if="name === 'user'"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 6 0 0 1 16 0v2"/></g>
    <g v-else-if="name === 'pin'"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></g>
    <path v-else-if="name === 'star'" d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z"/>
    <g v-else-if="name === 'fork'"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6 7v3a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V7m-6 7v4"/></g>
    <path v-else-if="name === 'code'" d="m7 6-6 6 6 6m10-12 6 6-6 6m-3-14-4 16"/>
    <AnimatedIconShape v-else-if="name === 'play' || name === 'pause'" kind="playback" :active="name === 'pause'"/>
    <g v-else-if="name === 'replay'"><path d="M4 9a8 8 0 1 1-.1 6M4 3v6h6"/></g>
    <g v-else-if="name === 'mail'"><path class="mail-letter" d="M7 11V4h10v7m-7-4h4"/><rect x="3" y="5" width="18" height="14" rx="2" fill="var(--card-bg-color)"/><path class="mail-flap" d="m3 6 9 7 9-7"/></g>
    <g v-else-if="name === 'more'" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></g>
  </svg>
</template>
