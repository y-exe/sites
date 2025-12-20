import { useIntro } from '~/composables/useIntro'

export default defineNuxtPlugin((nuxtApp) => {
  const { introElements } = useIntro()
  
  let revealObserver: IntersectionObserver | null = null
  let textObserver: IntersectionObserver | null = null

  const initObservers = () => {
    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
        else entry.target.classList.remove('is-visible')
      })
    }
    revealObserver = new IntersectionObserver(callback, { rootMargin: "0px 0px -50px 0px" })
    textObserver = new IntersectionObserver(callback, { threshold: 0.2 })
  }

  initObservers()

  nuxtApp.vueApp.directive('reveal', {
    mounted: (el: HTMLElement, binding: any) => {
      el.dataset.reveal = binding.arg || 'up'
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