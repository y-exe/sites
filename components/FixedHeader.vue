<script setup lang="ts">
import { useIntro } from '~/composables/useIntro'

const { isHeaderIntroDone, setIntroRef } = useIntro()
const { y: scrollY } = useWindowScroll()
const isScrolledDown = computed(() => scrollY.value > 50)
const currentTime = useDateFormat(useNow(), 'HH:mm:ss')

const headerClasses = computed(() => ({
  'is-visible': isHeaderIntroDone.value && !isScrolledDown.value,
  'hidden': isScrolledDown.value
}))
</script>

<template>
  <div>
    <div class="header-fixed-item shields-container intro-sequence tw:fixed tw:top-6 tw:left-6 tw:z-[1000] tw:flex tw:flex-col tw:items-start tw:gap-2" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <img class="shields-badge" src="https://img.shields.io/github/last-commit/y-exe/sites" alt="Last Commit" width="120" height="20" loading="eager">
      <a href="https://github.com/y-exe/sites"><img class="shields-badge" src="https://img.shields.io/badge/Github-y_exe-blue?style=flat-square" alt="Github" width="90" height="20" loading="eager"></a>
      <a href="https://x.com/y__exe"><img class="shields-badge" src="https://img.shields.io/badge/Twitter(X)-@y__exe-blue?style=flat-square" alt="Twitter(X)" width="110" height="20" loading="eager"></a>
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
      はよ寝ろ
    </div>
  </div>
</template>
