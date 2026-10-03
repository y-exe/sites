import { isTerminalClient, terminalPageFor } from '../../utils/terminal-page'

const playfulHeaders = {
  'X-Yexe-Mood': 'probably-coding',
  'X-Secret-Path': '/robots.txt',
  'X-Server-Flavor': 'rabbit-house/1.0',
  'X-Actually-Useful': 'debatable'
}

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  Object.entries(playfulHeaders).forEach(([name, value]) => setResponseHeader(event, name, value))

  const userAgent = getHeader(event, 'user-agent') || ''
  if (requestUrl.pathname !== '/' || !isTerminalClient(userAgent)) return
  const terminal = terminalPageFor(userAgent)

  setResponseHeader(event, 'Content-Type', terminal.contentType)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'Vary', 'User-Agent')
  if (terminal.downloadName) setResponseHeader(event, 'Content-Disposition', `attachment; filename="${terminal.downloadName}"`)
  return terminal.body
})
