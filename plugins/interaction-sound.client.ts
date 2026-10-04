import { createInteractionAudio, type InteractionSound } from '~/utils/interaction-audio'

export default defineNuxtPlugin(nuxtApp => {
  const { enabled, pulse } = useInteractionSound()
  const { toast } = useSiteToast()
  const audio = createInteractionAudio(() => {
    const Context = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) throw new Error('Audio unavailable')
    return new Context()
  }, () => { pulse.value++ })
  const stopEnabledWatch = watch(enabled, value => { if (!value) audio.cancel() }, { flush: 'sync' })
  const stopToastWatch = watch(toast, value => {
    if (enabled.value && value.show && document.visibilityState === 'visible') void audio.play(value.kind)
  })
  const activate = (event: MouseEvent) => {
    if (document.querySelector('.page-404')) return
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    const target = event.target as Element | null
    const host = target?.closest<HTMLElement>('button, a[href], [role="button"]') || target
    if (!host || host.closest('[inert], .nuxt-devtools-anchor') || host.matches(':disabled, [aria-disabled="true"]') || document.querySelector('#loading')) return
    if (host.hasAttribute('data-sound-toggle')) return
    if (!enabled.value) return
    void audio.unlock()
    const kind: InteractionSound = host.matches('.theme-toggle') ? 'toggle'
      : host.matches('.modal-close-btn, .project-modal-close, .image-viewer-close, .toast-dismiss, .project-modal-overlay, #pgp-modal, .image-viewer, .play-close, .play-backdrop') ? 'close'
      : host.hasAttribute('aria-expanded') ? host.getAttribute('aria-expanded') === 'true' ? 'close' : 'open'
      : host.hasAttribute('aria-haspopup') || host.matches('.project-card, .gallery-expand') ? 'open' : 'tap'
    void audio.play(kind)
  }
  const storageChanged = (event: StorageEvent) => {
    if (event.key === 'site-sound-enabled' || event.key === null) enabled.value = event.newValue !== '0'
  }
  const visibilityChanged = () => { if (document.visibilityState !== 'visible') audio.cancel() }
  document.addEventListener('click', activate, true)
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('storage', storageChanged)
  const cleanup = () => {
    stopEnabledWatch(); stopToastWatch(); audio.dispose()
    document.removeEventListener('click', activate, true)
    document.removeEventListener('visibilitychange', visibilityChanged)
    window.removeEventListener('storage', storageChanged)
  }
  nuxtApp.vueApp.onUnmount(cleanup)
  if (import.meta.hot) import.meta.hot.dispose(cleanup)
  return { provide: { interactionAudio: audio } }
})
