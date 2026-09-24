import { tinoPixelRows, tinoWidth } from './tino-art'

const pixelAt = (row: number, column: number): string | null => {
  const pixel = tinoPixelRows[row]?.slice(column * 6, column * 6 + 6)
  return !pixel || pixel === '------' ? null : pixel.match(/.{2}/g)!.map(value => String(parseInt(value, 16))).join(';')
}

const tinoArt = Array.from({ length: Math.floor(tinoPixelRows.length / 2) }, (_, row) => {
  let previous = ''
  let output = ''
  for (let column = 0; column < tinoWidth; column++) {
    const top = pixelAt(row * 2, column)
    const bottom = pixelAt(row * 2 + 1, column)
    if (!top && !bottom) {
      output += '\x1b[0m '
      previous = ''
      continue
    }

    const style = top && bottom
      ? `\x1b[38;2;${top};48;2;${bottom}m`
      : `\x1b[38;2;${top || bottom};49m`
    if (style !== previous) output += style
    previous = style
    output += top && bottom ? '▀' : top ? '▀' : '▄'
  }
  return `${output}\x1b[0m`
}).join('\n')

const color = (hex: string, text: string, bold = true) => {
  const [red, green, blue] = hex.match(/[\da-f]{2}/gi)!.map(value => parseInt(value, 16))
  return `\x1b[${bold ? '1;' : ''}38;2;${red};${green};${blue}m${text}\x1b[0m`
}
const palette = [
  '#4255b6', '#6e6c99', '#6da7f2', '#00c0fe', '#8e93e1', '#a0b1ed', '#d4d5d7', '#e8e5e3',
  '#e9eafd', '#f9f9fe', '#fcf7f2', '#fdd6d5', '#faa6aa', '#feacb2', '#fdf7f3', '#ffffff'
]
const muted = (text: string) => color('#6e6c99', text, false)
const hyperlink = (url: string, text: string) => `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`
const keyValue = (label: string, value: string, valueColor = '#e9eafd') =>
  `  ${color('#a0b1ed', `${label}:`.padEnd(12))} ${color(valueColor, value)}`
const swatchRow = (colors: string[]) => colors
  .map(hex => `\x1b[48;2;${hex.slice(1).match(/.{2}/g)!.map(value => parseInt(value, 16)).join(';')}m   `)
  .join('') + '\x1b[0m'
const colorSwatches = swatchRow(palette.slice(0, 8))
const brightSwatches = swatchRow(palette.slice(8))

const info = [
  `  ${color('#6da7f2', 'Tino')}${muted('@')}${color('#a0b1ed', 'yexe.net')}`,
  `  ${muted('───────────────────────')}`,
  keyValue('User', color('#6da7f2', 'y_exe')),
  keyValue('Role', 'developer-wannabe'),
  keyValue('Location', 'Fukuoka, Japan'),
  '',
  keyValue('Languages', 'VSCode · IntelliJ IDEA · Vim'),
  keyValue('Frontend', 'TS · JS · Vue · Nuxt.js · React · Next.js · Astro'),
  keyValue('Backend', 'Node.js · Python · Go · Java · Kotlin'),
  '',
  keyValue('GitHub', hyperlink('https://github.com/y-exe', '@y-exe'), '#6da7f2'),
  keyValue('X', hyperlink('https://x.com/y__exe', '@y__exe'), '#a0b1ed'),
  keyValue('Discord', hyperlink('https://discord.com/users/483307286513582090', '@y_exe'), '#8e93e1'),
  keyValue('Website', hyperlink('https://yexe.net', 'https://yexe.net'), '#38427D'),
  '',
  `  ${colorSwatches}`,
  `  ${brightSwatches}`,
  ''
]

const profileLayout = tinoArt.split('\n').map((row, index) => `   ${row}   ${info[index] || ''}`).join('\n')

export const curlPage = [
  '',
  profileLayout,
  '',
  ''
].join('\n')

export const isTerminalClient = (userAgent: string) => /\b(?:curl|wget)\//i.test(userAgent)
