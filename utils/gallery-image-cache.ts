const decodedImages = new Map<string, { image: HTMLImageElement; decodedAt: number }>()
const lifetime = 5 * 60_000

export const getDecodedGalleryImage = (src: string) => {
  const entry = decodedImages.get(src)
  if (!entry) return null
  decodedImages.delete(src)
  if (Date.now() - entry.decodedAt >= lifetime || !entry.image.complete || !entry.image.naturalWidth) return null
  decodedImages.set(src, entry)
  return entry.image
}

export const rememberDecodedGalleryImage = (src: string, image: HTMLImageElement) => {
  if (!image.complete || !image.naturalWidth) return
  decodedImages.delete(src)
  decodedImages.set(src, { image, decodedAt: Date.now() })
  while (decodedImages.size > 4) decodedImages.delete(decodedImages.keys().next().value!)
}
