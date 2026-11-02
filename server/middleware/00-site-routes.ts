import { siteRouteResponse, projectWebsiteResponse } from '../../utils/site-routing'

export default defineEventHandler(async event => {
  const request = new Request(getRequestURL(event), { method: getMethod(event) })
  const response = siteRouteResponse(request) || await projectWebsiteResponse(request, useRuntimeConfig(event).githubToken)
  if (response) return response
})
