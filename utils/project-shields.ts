export type ProjectShield = { src: string; href?: string; alt: string }
type Repository = { owner: { login: string }; name: string; default_branch: string }

const decodeAttribute = (value: string) => value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'")
const attribute = (tag: string, name: string) => decodeAttribute(tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] || '')
const destination = (value: string) => value.trim().match(/^<([^>]+)>|^(\S+)/)?.slice(1).find(Boolean) || ''

// Read balanced parentheses so URLs such as badge/Twitter(X)-blue survive parsing.
const parentheses = (source: string, start: number) => {
  let depth = 0
  for (let index = start; index < source.length; index++) {
    if (source[index] === '\\') { index++; continue }
    if (source[index] === '(') depth++
    if (source[index] === ')' && --depth === 0) return { value: source.slice(start + 1, index), end: index + 1 }
  }
  return null
}

export const getReadmeShields = (readme: string, repo: Repository): ProjectShield[] => {
  const entries: { index: number; source: string; link: string; alt: string }[] = []
  const references = new Map([...readme.matchAll(/^\s*\[([^\]]+)\]:\s*(.+)$/gm)]
    .map(match => [match[1].trim().toLowerCase(), destination(match[2])]))
  let anchor = ''
  for (const match of readme.matchAll(/<a\b[^>]*>|<\/a\s*>|<img\b[^>]*>/gi)) {
    if (/^<a\b/i.test(match[0])) anchor = attribute(match[0], 'href')
    else if (/^<\/a/i.test(match[0])) anchor = ''
    else entries.push({ index: match.index, source: attribute(match[0], 'src'), link: anchor, alt: attribute(match[0], 'alt') })
  }
  for (const match of readme.matchAll(/!\[([^\]]*)\](?=\(|\[)/g)) {
    const start = match.index + match[0].length
    const image = readme[start] === '(' ? parentheses(readme, start) : null
    const reference = readme.slice(start).match(/^\[([^\]]*)\]/)
    const source = image ? destination(image.value) : references.get((reference?.[1] || match[1]).trim().toLowerCase()) || ''
    const end = image?.end ?? start + (reference?.[0].length || 0)
    let link = ''
    if (readme[match.index - 1] === '[' && readme[end] === ']') {
      const target = readme[end + 1] === '(' ? parentheses(readme, end + 1) : null
      const targetReference = readme.slice(end + 1).match(/^\[([^\]]+)\]/)
      link = target ? destination(target.value) : references.get(targetReference?.[1].trim().toLowerCase() || '') || ''
    }
    entries.push({ index: match.index, source: decodeAttribute(source), link: decodeAttribute(link), alt: match[1] })
  }
  const imageBase = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${repo.default_branch}/`
  const linkBase = `https://github.com/${repo.owner.login}/${repo.name}/blob/${repo.default_branch}/`
  const safeUrl = (value: string, base: string) => {
    if (!value) return undefined
    try {
      const url = new URL(value, base)
      return ['https:', 'http:'].includes(url.protocol) ? url : undefined
    } catch { return undefined }
  }
  return entries.sort((a, b) => a.index - b.index).flatMap(entry => {
    const src = safeUrl(entry.source, imageBase)
    if (src?.hostname !== 'img.shields.io') return []
    const href = safeUrl(entry.link || src.searchParams.get('link') || '', linkBase)?.href
    return [{ src: src.href, href, alt: entry.alt || 'プロジェクトのバッジ' }]
  }).slice(0, 4)
}
