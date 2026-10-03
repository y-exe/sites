let revealObserver: IntersectionObserver | null = null
let textObserver: IntersectionObserver | null = null

export const useSharedObserver = () => {
  const initObservers = () => {
    if (!import.meta.client) return
    if (revealObserver) return

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting)
      })
    }
    
    revealObserver = new IntersectionObserver(callback)
    textObserver = new IntersectionObserver(callback, { threshold: 0.2 })
  }

  const getObservers = () => {
    if (!revealObserver) initObservers()
    return { revealObserver, textObserver }
  }

  return {
    initObservers,
    getObservers
  }
}
