import React, { useEffect, useRef, useState } from 'react'
import { CAlert, CButton, CFormLabel, CFormText, CProgress, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload, cilImagePlus, cilX } from '@coreui/icons'

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Web-side replacement for `expo-image-picker`. Handles file picker, drag-drop,
 * preview, MIME / size validation, upload progress, and surfaces a normalized
 * `{ key, path, isAbsolute }` once the upload succeeds.
 *
 * Props are intentionally controlled — the parent page owns the upload result
 * so we can reuse it across submit attempts (e.g. retrying after a UTR fix).
 */
const PaymentScreenshotInput = ({ value, onChange, onUpload, disabled }) => {
  const inputRef = useRef(null)
  const [pickedFile, setPickedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl],
  )

  const validate = (file) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return 'Use a JPEG, PNG, or WebP image.'
    }
    if (file.size > MAX_BYTES) {
      return 'Screenshot must be under 5 MB.'
    }
    return null
  }

  const performUpload = async (file) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    try {
      const result = await onUpload({ file, onUploadProgress: setProgress })
      if (result?.error) {
        setError(result.payload?.message || 'Upload failed. Try again.')
        onChange(null)
        return
      }
      const payload = result?.payload || result
      onChange(payload || null)
    } catch (uploadError) {
      setError(uploadError?.message || 'Upload failed. Try again.')
      onChange(null)
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (file) => {
    if (!file || disabled) return
    const message = validate(file)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const nextPreview = URL.createObjectURL(file)
    setPickedFile(file)
    setPreviewUrl(nextPreview)
    performUpload(file)
  }

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPickedFile(null)
    setPreviewUrl(null)
    setProgress(0)
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    if (disabled) return
    const file = event.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const uploaded = !!value?.key
  const showProgress = uploading || (progress > 0 && progress < 100)

  return (
    <div>
      <CFormLabel className="d-block">Screenshot (optional)</CFormLabel>
      <CFormText className="d-block mb-2">
        A screenshot helps your coach verify faster. JPEG / PNG / WebP up to 5 MB.
      </CFormText>

      <div
        className="border border-2 border-dashed rounded-3 p-3 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="d-flex flex-column align-items-center gap-2">
            <img
              src={previewUrl}
              alt={pickedFile?.name || 'Screenshot preview'}
              className="img-thumbnail"
              style={{ maxHeight: '180px', objectFit: 'contain' }}
            />
            <div className="text-body-secondary small">
              {pickedFile?.name} · {(pickedFile?.size / 1024).toFixed(0)} KB
            </div>
            <div className="d-flex gap-2">
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || uploading}
              >
                <CIcon icon={cilImagePlus} className="me-1" /> Replace
              </CButton>
              <CButton
                size="sm"
                color="danger"
                variant="outline"
                type="button"
                onClick={handleClear}
                disabled={disabled || uploading}
              >
                <CIcon icon={cilX} className="me-1" /> Remove
              </CButton>
            </div>
          </div>
        ) : (
          <div className="py-3">
            <CIcon icon={cilCloudUpload} size="xl" className="text-body-secondary mb-2" />
            <div className="mb-2 text-body-secondary">Drag a screenshot here, or</div>
            <CButton
              type="button"
              color="primary"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Choose photo
            </CButton>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="d-none"
          onChange={(event) => handleFile(event.target.files?.[0])}
          disabled={disabled}
        />
      </div>

      {showProgress ? (
        <div className="mt-2">
          <CProgress value={progress} />
          <div className="text-body-secondary small mt-1">
            {uploading ? (
              <>
                <CSpinner size="sm" className="me-2" /> Uploading… {progress}%
              </>
            ) : (
              `Uploaded ${progress}%`
            )}
          </div>
        </div>
      ) : null}

      {uploaded && !showProgress ? (
        <CAlert color="success" className="py-2 mt-2 mb-0">
          Screenshot uploaded. Submit to send it with your report.
        </CAlert>
      ) : null}

      {error ? (
        <CAlert color="danger" className="py-2 mt-2 mb-0">
          {error}
        </CAlert>
      ) : null}
    </div>
  )
}

export default PaymentScreenshotInput
