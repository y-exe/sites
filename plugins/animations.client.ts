import { useSharedObserver } from '~/composables/useSharedObserver'

export default defineNuxtPlugin((nuxtApp) => {
  const { getObservers } = useSharedObserver()
  
  const { revealObserver, textObserver } = getObservers()

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding: any) {
      el.dataset.reveal = binding.arg || 'up'
      if (!el.classList.contains('intro-sequence')) {
        revealObserver?.observe(el)
      }
    },
    beforeUnmount(el: HTMLElement) {
      revealObserver?.unobserve(el)
    }
  })

  nuxtApp.vueApp.directive('split-text', {
    mounted(el: HTMLElement) {
      el.dataset.splitText = ''
      el.classList.add('is-ready')
      if (!el.classList.contains('intro-sequence')) {
        textObserver?.observe(el)
      }
    },
    beforeUnmount(el: HTMLElement) {
      textObserver?.unobserve(el)
    }
  })
})