type TaggedProject = { name: string; topics?: string[]; language?: string | null; description?: string | null }

const projectTags: Record<string, readonly string[]> = {
  AniCome: ['android', 'anime', 'media'],
  DiscordWebAnalytics: ['web', 'discord', 'analytics'],
  DiscordWebBotClient: ['web', 'discord', 'selfbot'],
  'games-bot': ['discord', 'bot', 'game'],
  'notice-selfbot': ['discord', 'selfbot', 'notification'],
  'tokumei-bot': ['discord', 'bot', 'chat'],
  sites: ['web', 'portfolio'],
  votesites: ['web', 'event'],
  'ymkw-mad': ['web', 'media'],
  'image-to-url': ['web', 'image', 'tool'],
  'grok-selfbot': ['discord', 'selfbot', 'ai'],
  'scramjet-japanese': ['web', 'tool'],
}

export const getProjectTags = (project: TaggedProject): readonly string[] => {
  if (Object.hasOwn(projectTags, project.name)) return projectTags[project.name]
  const topics = (project.topics || []).map(topic => topic.toLowerCase())
  const tags = new Set<string>()
  if (topics.some(topic => /^(web|website|nextjs|nuxtjs|vuejs|react|frontend)$/.test(topic)) || ['HTML', 'CSS', 'Vue', 'Svelte'].includes(project.language || '')) tags.add('web')
  if (topics.includes('android') || /\bandroid\b/i.test(project.description || '')) tags.add('android')
  if (topics.some(topic => /^discord(?:-|$)/.test(topic))) tags.add('discord')
  if (/self-?bot/i.test(project.name)) tags.add('selfbot')
  else if (/(?:^|-)bot(?:-|$)/i.test(project.name)) tags.add('bot')
  return tags.size ? [...tags] : ['tool']
}

export const getProjectTagCounts = (projects: TaggedProject[]) => {
  const counts = new Map<string, number>()
  for (const project of projects) {
    for (const tag of getProjectTags(project)) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
