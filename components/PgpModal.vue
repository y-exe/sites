<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

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
    label: 'Spotify',
    logoUrl: 'https://www.google.com/s2/favicons?domain=open.spotify.com&sz=64',
    value: "(*'▽')",
    href: 'https://open.spotify.com/user/31n5nex7qn7xy3of33wft4dl5ine'
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
    label: 'sizu.me',
    logoUrl: 'https://www.google.com/s2/favicons?domain=sizu.me&sz=64',
    value: 'yexe',
    href: 'https://sizu.me/yexe'
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
  <div v-if="modelValue" id="pgp-modal" class="modal-overlay visible" data-lenis-prevent @click.self="close">
    <button class="modal-close-btn" type="button" @click="close">&times;</button>
    <div class="modal-content" data-lenis-prevent>
      <section class="modal-section">
        <h3>PGP Public Key</h3>
        <div class="pgp-key-wrap">
          <button type="button" class="pgp-copy-btn" aria-label="Copy PGP public key" @click="copyKey">
            <i class="fa-regular fa-copy"></i>
          </button>
          <pre class="pgp-key-block">{{ pgpKeyText }}</pre>
        </div>
        <div class="pgp-fingerprint">
          <strong>Fingerprint :</strong> d4c3e04190c51e407afc65147bcfcf0c72d76593
        </div>
      </section>

      <div class="other-links">
        <component
          :is="contact.href ? 'a' : 'button'"
          v-for="contact in otherContacts"
          :key="contact.label"
          class="contact-item other-link-item"
          :href="contact.href"
          :target="contact.href ? '_blank' : undefined"
          :rel="contact.href ? 'noopener noreferrer' : undefined"
          @click="contact.href ? undefined : copyValue(contact.copyValue || contact.value)"
        >
          <div class="contact-info-left">
            <img :src="contact.logoUrl" :alt="`${contact.label} logo`" class="contact-logo-img">
            <span class="contact-name">{{ contact.label }}</span>
          </div>
          <span class="contact-username-pill">{{ contact.value }}</span>
        </component>
      </div>
    </div>
  </div>
</template>
