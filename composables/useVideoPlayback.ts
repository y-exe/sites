import { onUnmounted, watch, type Ref } from 'vue'

export const useVideoPlayback = (videos: Ref<HTMLVideoElement | null>[], playing: Ref<boolean>, restart: Ref<boolean>) => {
  const sync = () => {
    for (const target of videos) {
      const video = target.value
      if (!video) continue
      if (!playing.value) {
        video.pause()
        if (restart.value && video.currentTime > 0) video.currentTime = 0
        continue
      }
      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      if (video.paused) void video.play().then(() => {
        if (!playing.value || !video.isConnected) video.pause()
      }).catch(() => {})
    }
  }
  watch([playing, restart, ...videos], sync, { flush: 'post', immediate: true })
  onUnmounted(() => videos.forEach(video => video.value?.pause()))
  return sync
}
