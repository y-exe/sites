export const discordUserId = '483307286513582090'

export const contactDestinations: Record<string, string> = {
  '/github': 'https://github.com/y-exe',
  '/discord': `https://discord.com/users/${discordUserId}`,
  '/x': 'https://x.com/y__exe',
  '/twitter': 'https://x.com/y__exe',
  '/matrix': 'https://matrix.to/#/@yexe:matrix.org',
  '/signal': 'https://signal.me/#eu/coWGpls-QtNkrqZ8-wohlyrkC35mfWNncnTFRuoU_q6P9mXTqnpDp4h1g05dWLTY',
  '/spotify': 'https://open.spotify.com/user/31n5nex7qn7xy3of33wft4dl5ine',
  '/vrchat': 'https://vrchat.com/home/user/usr_ed7337f3-110d-4669-87a3-2d2c4b734e4a',
  '/minecraft': 'https://namemc.com/profile/y_exe',
  '/annict': 'https://annict.com/@yexe/watched',
  '/sizume': 'https://sizu.me/yexe',
  '/status': 'https://status.yexe.xyz/status/all',
}

export const projectPath = (name: string) => `/project/${encodeURIComponent(name)}`
export const sectionPath = (id: string) => id === '#about' ? '/about' : id === '#projects' ? '/project' : '/'
export const isPortfolioPath = (path: string) => path !== '/project/_payload.json'
  && /^\/(?:about|project(?:\/[A-Za-z0-9_.-]+)?)?\/?$/.test(path)
export const portfolioSection = (path: string, hash = '') => path.startsWith('/project') || hash === '#projects'
  ? '#projects' : path === '/about' || hash === '#about' ? '#about' : '#top'

export function outboundPathFor(href: string): string {
  const contact = Object.entries(contactDestinations).find(([, destination]) => destination === href)
  if (contact) return contact[0]
  try {
    const url = new URL(href)
    if (url.origin === 'https://github.com' && (url.pathname === '/y-exe' || url.pathname.startsWith('/y-exe/'))) {
      return `/github${url.pathname.slice('/y-exe'.length)}${url.search}${url.hash}`
    }
  } catch { /* Relative and non-web links remain unchanged. */ }
  return href
}
