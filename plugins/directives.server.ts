export default defineNuxtPlugin((nuxtApp) => {
  const noopDirective = {}

  nuxtApp.vueApp.directive('reveal', noopDirective)
  nuxtApp.vueApp.directive('split-text', noopDirective)
})