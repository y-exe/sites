import { useIntro } from '~/composables/useIntro'
import { useSharedObserver } from '~/composables/useSharedObserver'

export default defineNuxtPlugin((nuxtApp) => {
  const { introElements, isHeaderIntroDone } = useIntro()
  
  const { revealObserver, textObserver } = useSharedObserver().getObservers()

  nuxtApp.vueApp.directive('reveal', {
    mounted: (el: HTMLElement, binding: any) => {
      el.dataset.reveal = binding.arg || 'up'
      if (isHeaderIntroDone.value && introElements.value.includes(el)) el.classList.add('is-visible')
      if (!introElements.value.includes(el)) {
        revealObserver?.observe(el)
      }
    },
    beforeUnmount: (el: HTMLElement) => revealObserver?.unobserve(el)
  })

  nuxtApp.vueApp.directive('split-text', {
    mounted: (el: HTMLElement) => {
      el.dataset.splitText = ''
      el.classList.add('is-ready')
      if (isHeaderIntroDone.value && introElements.value.includes(el)) el.classList.add('is-visible')
      if (!introElements.value.includes(el)) {
        textObserver?.observe(el)
      }
    },
    beforeUnmount: (el: HTMLElement) => textObserver?.unobserve(el)
  })
  
  return {
    provide: {
      revealObserver,
      textObserver
    }
  }
})
