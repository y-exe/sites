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
    <div class="header-fixed-item shields-container intro-sequence" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <img class="shields-badge" src="https://img.shields.io/github/last-commit/y-exe/sites" alt="Last Commit" width="120" height="20">
      <a href="https://github.com/y-exe/sites"><img class="shields-badge" src="https://img.shields.io/badge/Github-y_exe-blue?style=flat-square" alt="Github" width="90" height="20"></a>
      <a href="https://x.com/y__exe"><img class="shields-badge" src="https://img.shields.io/badge/Twitter(X)-@y__exe-blue?style=flat-square" alt="Twitter(X)" width="110" height="20"></a>
    </div>

    <div id="getloli-counter" class="header-fixed-item intro-sequence" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      <img src="https://count.getloli.com/@yexe.net?theme=rule34" alt=":counter" width="300" height="80" />
      <span id="getloli-counter-text">アクセス感謝～</span>
    </div>

    <div id="now" class="header-fixed-item intro-sequence" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      現在時刻：{{ currentTime }}
    </div>
    <div id="hayane" class="header-fixed-item intro-sequence" :ref="setIntroRef" data-reveal="down" :class="headerClasses">
      はよ寝ろ
    </div>
  </div>
</template>