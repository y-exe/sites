import { useIntro } from '~/composables/useIntro'
import { useSharedObserver } from '~/composables/useSharedObserver'

export default defineNuxtPlugin((nuxtApp) => {
  const { introElements, isHeaderIntroDone } = useIntro()
  
  const { revealObserver, textObserver } = useSharedObserver().getObservers()
  const isIntroElement = (el: HTMLElement) => el.classList.contains('intro-sequence') || introElements.value.includes(el)

  nuxtApp.vueApp.directive('reveal', {
    mounted: (el: HTMLElement, binding: any) => {
      el.dataset.reveal = binding.arg || 'up'
      if (isHeaderIntroDone.value && isIntroElement(el)) el.classList.add('is-visible')
      if (!isIntroElement(el)) {
        revealObserver?.observe(el)
      }
    },
    beforeUnmount: (el: HTMLElement) => revealObserver?.unobserve(el)
  })

  nuxtApp.vueApp.directive('split-text', {
    mounted: (el: HTMLElement) => {
      el.dataset.splitText = ''
      el.classList.add('is-ready')
      if (isHeaderIntroDone.value && isIntroElement(el)) el.classList.add('is-visible')
      if (!isIntroElement(el)) {
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
