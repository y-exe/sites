export const useInteractionSound = () => {
  const enabled = useState('site-sound-enabled', () => true)
  const pulse = useState('site-sound-pulse', () => 0)
  const restore = () => {
    try { enabled.value = localStorage.getItem('site-sound-enabled') !== '0' } catch {}
  }
  const toggle = (): void => {
    enabled.value = !enabled.value
    try { localStorage.setItem('site-sound-enabled', enabled.value ? '1' : '0') } catch {}
    if (enabled.value) void useNuxtApp().$interactionAudio.play('toggle')
  }
  return { enabled, pulse, toggle, restore }
}
