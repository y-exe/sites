import { curlPage, isTerminalClient } from '../utils/curl-page'

export const onRequest = async ({ request, next }: { request: Request; next: () => Promise<Response> }) => {
  if (!isTerminalClient(request.headers.get('user-agent') || '')) return next()

  return new Response(curlPage, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Vary': 'User-Agent'
    }
  })
}
