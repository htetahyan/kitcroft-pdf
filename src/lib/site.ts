export const SITE = {
  name: "Kitcroft",
  domain: "kitcroft.online",
  url: "https://kitcroft.online",
  tagline: "100% Free PDF tools that stay in your browser",
  description:
    "100% free online PDF editor, merge, compress, split, rotate, and sign. No upload, no signup, no task limit, no watermark. Files never leave this device.",
  locale: "en_US",
  keywords: [
    "free pdf editor",
    "free pdf editor online",
    "edit pdf online free",
    "free pdf tools",
    "free pdf tools online",
    "merge pdf free",
    "compress pdf free",
    "split pdf free",
    "sign pdf free",
    "pdf tools online free",
    "edit pdf no upload",
    "unlimited free pdf editor",
    "free pdf software",
    "no watermark pdf editor",
    "free pdf converter online",
    "100% free pdf tools",
  ],
} as const;

export function absUrl(path = "/") {
  if (!path || path === "/") return SITE.url;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p}`;
}
