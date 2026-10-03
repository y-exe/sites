export const matchesProjectSearch = (project: { name?: string; description?: string | null; language?: string | null; topics?: string[] }, query: string) => {
  const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase()
  const terms = normalize(query).trim().split(/\s+/u).filter(Boolean)
  const text = normalize([project.name, project.description, project.language, ...(project.topics || [])].join(' '))
  return terms.every(term => text.includes(term))
}
