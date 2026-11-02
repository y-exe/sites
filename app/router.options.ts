import type { RouterConfig } from '@nuxt/schema'

// The portfolio handles section scrolling after its loading animation and on history navigation.
export default { scrollBehavior: () => false } satisfies RouterConfig
