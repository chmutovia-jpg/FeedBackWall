import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import {
  MAX_IMAGE_SIZE_MB,
  SUPPORTED_IMAGE_TYPES,
  fileToDataUrl,
  formatFileSize,
  isSupportedImageType,
} from '../utils/fileToDataUrl'

export interface PickedImage {
  name: string
  type: string
  size: number
  dataUrl: string
}

interface ImageUploadProps {
  label: string
  helperText?: string
  maxFiles: number
  existingCount: number
  acceptedTypes?: readonly string[]
  maxSizeMb?: number
  onChange: (files: PickedImage[]) => void
}

export function ImageUpload({
  label,
  helperText,
  maxFiles,
  existingCount,
  acceptedTypes = SUPPORTED_IMAGE_TYPES,
  maxSizeMb = MAX_IMAGE_SIZE_MB,
  onChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const remaining = maxFiles - existingCount
  const isDisabled = remaining <= 0 || isProcessing

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || remaining <= 0) return
    const files = Array.from(fileList)
    const errors: string[] = []
    const accepted: File[] = []

    for (const file of files) {
      if (!isSupportedImageType(file.type) || !acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: unsupported file type`)
        continue
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        errors.push(`${file.name}: ${formatFileSize(file.size)}, max is ${maxSizeMb} MB`)
        continue
      }
      accepted.push(file)
    }

    const overflow = accepted.length - remaining
    if (overflow > 0) {
      errors.push(
        `Only ${remaining} more image${remaining === 1 ? '' : 's'} allowed - ${overflow} file${overflow === 1 ? '' : 's'} skipped.`,
      )
    }
    const toConvert = accepted.slice(0, remaining)

    setError(errors.length > 0 ? errors.join(' / ') : null)
    if (toConvert.length === 0) return

    setIsProcessing(true)
    try {
      const picked = await Promise.all(
        toConvert.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: await fileToDataUrl(file),
        })),
      )
      onChange(picked)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setIsDragActive(false)
    if (isDisabled) return
    void handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="fw-field">
      <span className="fw-label">{label}</span>
      <button
        type="button"
        disabled={isDisabled}
        className={`fw-dropzone ${isDragActive ? 'fw-dropzone-active' : ''} ${isDisabled ? 'fw-dropzone-disabled' : ''}`}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isDisabled) setIsDragActive(true)
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
      >
        <span className="fw-dropzone-text">
          {isProcessing
            ? 'Processing...'
            : remaining <= 0
              ? `Maximum of ${maxFiles} images reached`
              : 'Click or drag images here'}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleInputChange}
        disabled={isDisabled}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {helperText && !error && <span className="fw-hint">{helperText}</span>}
      {error && <span className="fw-error">{error}</span>}
    </div>
  )
}
