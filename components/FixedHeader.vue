<script setup lang="ts">
import { useIntro } from '~/composables/useIntro'

const { isHeaderIntroDone, setIntroRef } = useIntro()
const { sleeping } = usePlayState()
const { y: scrollY } = useWindowScroll()
const isScrolledDown = computed(() => scrollY.value > 50)
const currentTime = useDateFormat(useNow(), 'HH:mm:ss')

const historyLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0zIDExYTkgOSAwIDEgMSAyLjYgNy40TTMgNHY3aDdNMTIgN3Y1bDMgMiIvPjwvc3ZnPg=='
const lastCommitLabelUrl = `https://img.shields.io/badge/Last_Commit-555?${new URLSearchParams({
  style: 'flat',
  logo: historyLogo,
})}`
const lastCommitBadgeUrl = 'https://img.shields.io/github/last-commit/y-exe/sites?style=flat&label=&color=007ec6'

const headerClasses = computed(() => ({
  'is-visible': isHeaderIntroDone.value && !isScrolledDown.value,
  'hidden': isScrolledDown.value
}))
</script>

<template>
  <div :inert="isScrolledDown">
    <div class="header-fixed-item shields-container intro-sequence tw:fixed tw:top-6 tw:left-6 tw:z-[1000] tw:flex tw:flex-col tw:items-start tw:gap-2" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <a href="https://github.com/y-exe/sites" target="_blank" rel="noopener noreferrer" class="tw:inline-flex tw:items-center tw:overflow-hidden tw:rounded-[3px]">
        <img class="shields-badge tw:bg-[#555]" :src="lastCommitLabelUrl" alt="Last Commit" height="20" loading="eager">
        <img class="shields-badge tw:bg-[#007ec6]" :src="lastCommitBadgeUrl" alt="最終コミット日時" height="20" loading="eager">
      </a>
      <a href="https://github.com/y-exe" target="_blank" rel="noopener noreferrer"><img class="shields-badge" src="https://img.shields.io/badge/Github-y--exe-007ec6?style=flat&amp;labelColor=555&amp;logo=github&amp;logoColor=white" alt="Github y-exe" height="20" loading="eager"></a>
      <a href="https://x.com/y__exe" target="_blank" rel="noopener noreferrer"><img class="shields-badge" src="https://img.shields.io/badge/Twitter(X)-@y____exe-007ec6?style=flat&amp;labelColor=555&amp;logo=x&amp;logoColor=white" alt="Twitter(X) @y__exe" height="20" loading="eager"></a>
    </div>

    <div id="getloli-counter" class="header-fixed-item intro-sequence tw:fixed tw:top-4 tw:right-6 tw:z-[1000] tw:flex tw:flex-col tw:items-center" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <img class="tw:h-[100px] tw:w-auto" src="https://count.yexe.xyz/@yexe.net?theme=rule34" alt=":counter" width="300" height="80" loading="eager" />
      <span id="getloli-counter-text" class="tw:text-[0.8em] tw:text-[var(--text-muted-color)] tw:[font-family:var(--font-display)]">アクセス感謝～</span>
    </div>

    <ClientOnly>
      <div id="now" class="header-fixed-item intro-sequence tw:fixed tw:top-6 tw:left-1/2 tw:z-[1000] tw:whitespace-nowrap tw:text-[1rem] tw:text-[var(--text-muted-color)] tw:[font-family:var(--font-display)]" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
        現在時刻：{{ currentTime }}
      </div>
    </ClientOnly>

    <div id="hayane" class="header-fixed-item intro-sequence tw:fixed tw:top-14 tw:left-1/2 tw:z-[1000] tw:text-[1rem] tw:text-[var(--text-muted-color)] tw:[font-family:var(--font-display)]" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <button class="sleep-trigger" type="button" :aria-pressed="sleeping" @click="sleeping = !sleeping">{{ sleeping ? '寝たら負け' : 'はよ寝ろ' }}</button>
    </div>
  </div>
</template>
