<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const pgpTitleChars = [...'PGP Public Key']

const otherContacts = [
  {
    label: 'matrix.org',
    logoUrl: 'https://www.google.com/s2/favicons?domain=element.io&sz=64',
    value: 'yexe',
    copyValue: '@yexe:matrix.org',
    href: 'https://matrix.to/#/@yexe:matrix.org'
  },
  {
    label: 'Session',
    logoUrl: 'https://www.google.com/s2/favicons?domain=getsession.org&sz=64',
    value: "(*'▽')",
    copyValue: '05d6d19b6ec3dcf64d14ad12cc25a804eae2b23c2bec371defae034b1f6a32936f'
  },
  {
    label: 'Minecraft',
    logoUrl: 'https://www.google.com/s2/favicons?domain=minecraft.net&sz=64',
    value: 'y_exe',
    href: 'https://namemc.com/profile/y_exe'
  },
  {
    label: 'VRchat',
    logoUrl: 'https://www.google.com/s2/favicons?domain=vrchat.com&sz=64',
    value: 'y_exe',
    href: 'https://vrchat.com/home/user/usr_ed7337f3-110d-4669-87a3-2d2c4b734e4a'
  },
  {
    label: 'Genshin',
    logoUrl: 'https://www.google.com/s2/favicons?domain=genshin.hoyoverse.com&sz=64',
    value: '886013262'
  },
  {
    label: 'StarRail',
    logoUrl: 'https://www.google.com/s2/favicons?domain=hsr.hoyoverse.com&sz=64',
    value: '830445659'
  },
  {
    label: 'BlueArchive',
    logoUrl: 'https://www.google.com/s2/favicons?domain=bluearchive.nexon.com&sz=64',
    value: '76515340'
  },
  {
    label: 'Annict',
    logoUrl: 'https://www.google.com/s2/favicons?domain=annict.com&sz=64',
    value: 'yexe',
    href: 'https://annict.com/@yexe'
  }
]

const pgpKeyText = `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEaGdxTRYJKwYBBAHaRw8BAQdAmdRPek5wM0eBSZtgyL88XDlUZYT+HEh8
dwSFlrpoH9PNK3kuZXhlLjEyMDFAcHJvdG9uLm1lIDx5LmV4ZS4xMjAxQHBy
b3Rvbi5tZT7CwBEEExYKAIMFgmhncU0DCwkHCZB7z88Mctdlk0UUAAAAAAAc
ACBzYWx0QG5vdGF0aW9ucy5vcGVucGdwanMub3JnU3uwCjmthf09U+JiFj+T
ubdnHgGRVlV00HAsiTvI3NgDFQoIBBYAAgECGQECmwMCHgEWIQTUw+BBkMUe
QHr8ZRR7z88MctdlkwAATvgBANKYeQXWaJyBNPwNC6BkY2v3exEJXQU4en/J
yGTalTEDAQCSsYmdveGEHSW+KRk42wlj+AE6BUj6HXD7PA99R4TqDs44BGhn
cU0SCisGAQQBl1UBBQEBB0D26VCAcdqoJ3jql5m/0IY+BlO+CnhIeGTvODbh
WNUlOwMBCAfCvgQYFgoAcAWCaGdxTQmQe8/PDHLXZZNFFAAAAAAAHAAgc2Fs
dEBub3RhdGlvbnMub3BlbnBncGpzLm9yZ84HzviMRoHCUnvpjmbRGJfpjfmt
/FJ77rJLKbWt9dMSApsMFiEE1MPgQZDFHkB6/GUUe8/PDHLXZZMAAKQऽAP9A
XQXIOtNybkLCm/6/ezbr1w2KyXXzmvkwo1Fbqy0xTAD7BN8nz8vDwVOXa+E8
l3vt8HcNWaH+4Ob5YpDq7BzHIAI=
=tWhX
-----END PGP PUBLIC KEY BLOCK-----`

const close = () => emit('update:modelValue', false)

const copyKey = () => {
  navigator.clipboard.writeText(pgpKeyText).then(() => alert('コピーしました'))
}

const copyValue = (value: string) => {
  navigator.clipboard.writeText(value).then(() => alert('コピーしました'))
}

let isPageScrollLocked = false
let lockedScrollY = 0

const lockPageScroll = () => {
  if (isPageScrollLocked) return
  lockedScrollY = window.scrollY
  isPageScrollLocked = true
  document.documentElement.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
}

const unlockPageScroll = () => {
  if (!isPageScrollLocked) return
  isPageScrollLocked = false
  document.documentElement.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  window.scrollTo(0, lockedScrollY)
}

watch(() => props.modelValue, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) lockPageScroll()
  else unlockPageScroll()
}, { immediate: true })

onUnmounted(() => {
  if (!import.meta.client) return
  unlockPageScroll()
})
</script>

<template>
  <Transition name="modal-pop">
    <div v-if="modelValue" id="pgp-modal" class="modal-overlay visible tw:fixed tw:inset-0 tw:z-[2000] tw:flex tw:items-center tw:justify-center tw:bg-[rgba(10,10,10,0.75)] tw:p-8 tw:opacity-100 tw:visible tw:backdrop-blur-md tw:[overscroll-behavior:contain] tw:max-[760px]:items-start tw:max-[760px]:p-4" data-lenis-prevent @click.self="close">
      <button class="modal-close-btn pgp-modal-close-in tw:fixed tw:top-6 tw:right-6 tw:z-[2001] tw:inline-flex tw:size-[42px] tw:items-center tw:justify-center tw:rounded-lg tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[var(--pill-bg-color-dark)] tw:p-0 tw:text-[1.6rem] tw:leading-none tw:text-[var(--text-color-dark)] tw:transition-[background-color,color,transform] tw:duration-200 tw:hover:bg-[var(--text-color-dark)] tw:hover:text-[var(--bg-color-dark)] tw:max-[760px]:top-3 tw:max-[760px]:right-3" type="button" @click="close">&times;</button>
      <div class="modal-content tw:w-[min(1040px,100%)] tw:max-h-[min(86vh,860px)] tw:overflow-y-auto tw:rounded-[14px] tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[var(--card-bg-color-dark)] tw:p-8 tw:text-[var(--text-color-dark)] tw:shadow-[0_24px_80px_rgba(0,0,0,0.55)] tw:[overscroll-behavior:contain] tw:max-[760px]:max-h-[calc(100vh-2rem)] tw:max-[760px]:p-5" data-lenis-prevent>
        <section class="modal-section pgp-modal-section-in tw:mx-auto tw:w-[min(820px,100%)] tw:rounded-xl tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[var(--bg-alt-color-dark)] tw:p-[1.1rem]">
          <h3 class="tw:mt-0 tw:mb-4 tw:text-left tw:text-[1.1rem] tw:tracking-normal tw:text-[var(--text-color-dark)] tw:[font-family:var(--font-display)]"><span v-for="(char, index) in pgpTitleChars" :key="`${char}-${index}`" class="pgp-modal-title-char" :style="{ '--pgp-char-delay': `${180 + index * 42}ms` }">{{ char }}</span></h3>
          <div class="pgp-key-wrap pgp-key-in tw:relative">
            <button type="button" class="pgp-copy-btn tw:absolute tw:top-3 tw:right-7 tw:z-[1] tw:inline-flex tw:size-9 tw:items-center tw:justify-center tw:rounded-lg tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[var(--pill-bg-color-dark)] tw:p-0 tw:text-[var(--text-color-dark)] tw:transition-[background-color,color] tw:duration-200 tw:hover:bg-[var(--text-color-dark)] tw:hover:text-[var(--bg-color-dark)]" aria-label="Copy PGP public key" @click="copyKey">
              <i class="fa-regular fa-copy"></i>
            </button>
            <pre class="pgp-key-block tw:max-h-[220px] tw:overflow-y-auto tw:rounded-[10px] tw:border-2 tw:border-[var(--card-border-color-dark)] tw:bg-[#101010] tw:p-4 tw:text-left tw:font-mono tw:text-[0.78rem] tw:leading-[1.55] tw:text-[#adb5bd] tw:whitespace-pre-wrap tw:break-all">{{ pgpKeyText }}</pre>
          </div>
          <div class="pgp-fingerprint pgp-fingerprint-in tw:mt-[0.85rem] tw:text-left tw:text-[0.9rem] tw:text-[#adb5bd] tw:break-all">
            <strong class="tw:text-[var(--text-color-dark)] tw:[font-family:var(--font-display)]">Fingerprint :</strong> d4c3e04190c51e407afc65147bcfcf0c72d76593
          </div>
        </section>

        <div class="other-links pgp-other-links-in tw:mx-auto tw:mt-6 tw:grid tw:w-full tw:grid-cols-[repeat(2,300px)] tw:justify-center tw:gap-x-6 tw:gap-y-4 tw:max-[760px]:w-[min(360px,100%)] tw:max-[760px]:grid-cols-1">
          <component
            :is="contact.href ? 'a' : 'button'"
            v-for="(contact, index) in otherContacts"
            :key="contact.label"
            class="contact-item other-link-item pgp-contact-in tw:flex! tw:h-[41px] tw:min-h-[41px] tw:w-full tw:items-center tw:justify-between tw:appearance-none tw:border-2! tw:border-[var(--card-border-color-dark)]! tw:bg-[var(--card-bg-color-dark)]! tw:p-[0.2em_0.5em]! tw:[font:inherit] tw:text-left tw:text-[#adb5bd]! tw:hover:bg-[var(--pill-bg-color-dark)]! tw:hover:shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
            :style="{ '--pgp-link-delay': `${620 + index * 65}ms` }"
            :href="contact.href"
            :target="contact.href ? '_blank' : undefined"
            :rel="contact.href ? 'noopener noreferrer' : undefined"
            @click="contact.href ? undefined : copyValue(contact.copyValue || contact.value)"
          >
            <div class="contact-info-left tw:min-w-0">
              <img :src="contact.logoUrl" :alt="`${contact.label} logo`" class="contact-logo-img tw:size-[1.65em] tw:shrink-0 tw:rounded-[5px] tw:object-contain">
              <span class="contact-name tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[1.1em]! tw:text-[var(--text-color-dark)]!">{{ contact.label }}</span>
            </div>
            <span class="contact-username-pill tw:whitespace-nowrap tw:bg-[var(--pill-bg-color-dark)]! tw:text-[0.9em]! tw:text-[#adb5bd]!">{{ contact.value }}</span>
          </component>
        </div>
      </div>
    </div>
  </Transition>
</template>
