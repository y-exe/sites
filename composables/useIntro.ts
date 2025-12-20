// composables/useIntro.ts
export const useIntro = () => {
  const introElements = useState<HTMLElement[]>('introElements', () => [])
  
  const isHeaderIntroDone = useState<boolean>('isHeaderIntroDone', () => false)

  const setIntroRef = (el: any) => {
    if (el && el instanceof HTMLElement && !introElements.value.includes(el)) {
      introElements.value.push(el)
    }
  }

  const resetIntro = () => {
    introElements.value = []
    isHeaderIntroDone.value = false
  }

  return {
    introElements,
    isHeaderIntroDone,
    setIntroRef,
    resetIntro
  }
}