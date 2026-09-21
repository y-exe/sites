declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const gaId = config.public.gaId as string;

  if (!gaId) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", gaId);

  nuxtApp.hook("page:finish", () => {
    if (typeof window.gtag === "function") {
      window.gtag("config", gaId, {
        page_path: window.location.pathname + window.location.search,
      });
    }
  });
});
