export const useSiteTheme = () => {
  const isDarkMode = ref(false)
  const preference = ref<'system' | 'light' | 'dark'>('system')
  let media: MediaQueryList | null = null
  const apply = () => {
    isDarkMode.value = preference.value === 'system' ? Boolean(media?.matches) : preference.value === 'dark'
    document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
    document.body.classList.toggle('dark-mode', isDarkMode.value)
    document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
  }
  const setPreference = (value: typeof preference.value) => {
    preference.value = value
    try { if (value === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', value) } catch {}
    apply()
  }
  const toggleDarkMode = () => setPreference(isDarkMode.value ? 'light' : 'dark')
  const resetTheme = () => setPreference('system')
  const systemChanged = () => { if (preference.value === 'system') apply() }
  const storageChanged = (event: StorageEvent) => {
    if (event.key !== 'theme') return
    preference.value = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : 'system'
    apply()
  }
  onMounted(() => {
    media = matchMedia('(prefers-color-scheme: dark)')
    try { const stored = localStorage.getItem('theme'); preference.value = stored === 'dark' || stored === 'light' ? stored : 'system' } catch {}
    apply()
    media.addEventListener('change', systemChanged)
    window.addEventListener('storage', storageChanged)
  })
  onUnmounted(() => { media?.removeEventListener('change', systemChanged); window.removeEventListener('storage', storageChanged) })
  return { isDarkMode, preference, toggleDarkMode, resetTheme }
}
