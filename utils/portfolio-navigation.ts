export const PROJECT_THEME_LINE = 160
export const projectThemeActive = (projectTop: number) => projectTop <= PROJECT_THEME_LINE

export function portfolioEntry(path: string, hash: string, project: string | null) {
  if (project) return { section: '#projects', project, transient: false } as const
  if (path === '/project' || hash === '#projects') return { section: '#projects', project: null, transient: true } as const
  if (path === '/about' || hash === '#about') return { section: '#about', project: null, transient: true } as const
  if (hash === '#top') return { section: '#top', project: null, transient: true } as const
  return null
}
