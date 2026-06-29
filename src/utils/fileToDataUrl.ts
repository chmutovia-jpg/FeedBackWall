export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const MAX_IMAGE_SIZE_MB = 2

export const MAX_FEEDBACK_ATTACHMENTS = 3

export const MAX_PROJECT_SCREENSHOTS = 5

export function isSupportedImageType(type: string): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(type)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** Inverse of fileToDataUrl — needed to re-upload a staged picked file to Supabase Storage. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64 = ''] = dataUrl.split(',')
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? 'application/octet-stream'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
