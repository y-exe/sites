import { curlPage, isTerminalClient } from '../../utils/curl-page'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  if (requestUrl.pathname !== '/' || !isTerminalClient(getHeader(event, 'user-agent') || '')) return

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return curlPage
})
