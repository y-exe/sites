import type Lenis from 'lenis'
import { sectionPath } from '../utils/site-links'

export const useSectionNavigation = (getLenis: () => Lenis | null) => {
  const router = useRouter()
  const sectionNavigationActive = useState('section-navigation-active', () => false)
  return async (event: Event, id: string) => {
    if (event.defaultPrevented) return
    if (event instanceof MouseEvent && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
    const target = document.querySelector<HTMLElement>(id === '#' ? '#top' : id)
    if (!target) return
    event.preventDefault()
    const origin = event.currentTarget as HTMLElement | null
    const fromKeyboard = event instanceof MouseEvent && event.detail === 0
    sectionNavigationActive.value = true
    try { await router.push(sectionPath(id)) }
    finally { sectionNavigationActive.value = false }
    const finish = () => {
      if (!fromKeyboard) return
      if (document.activeElement !== origin && !(document.activeElement === document.body && origin?.closest('[inert]'))) return
      target.focus({ preventScroll: true })
    }
    const top = id === '#top' || id === '#'
    const lenis = getLenis()
    if (lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenis.scrollTo(top ? 0 : target, { duration: 1.2, onComplete: finish })
    } else {
      if (top) window.scrollTo({ top: 0, behavior: 'instant' })
      else target.scrollIntoView({ behavior: 'instant' })
      finish()
    }
  }
}
