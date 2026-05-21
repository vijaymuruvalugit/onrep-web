import React, { useRef } from 'react'
import { CAlert, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudUpload } from '@coreui/icons'
import { STUDENT_IMPORT_ACCEPT } from '../../api/studentImportApi'

const MAX_BYTES = 10 * 1024 * 1024

const UploadDropzone = ({ onFileSelected, disabled, error }) => {
  const inputRef = useRef(null)

  const validate = (file) => {
    if (!file) return 'No file selected.'
    const name = String(file.name || '').toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv') && !name.endsWith('.xls')) {
      return 'Use an Excel (.xlsx) or CSV (.csv) file.'
    }
    if (file.size > MAX_BYTES) {
      return 'File must be under 10 MB.'
    }
    return null
  }

  const handleFile = (file) => {
    if (!file || disabled) return
    const message = validate(file)
    if (message) {
      onFileSelected(null, message)
      return
    }
    onFileSelected(file, null)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    if (disabled) return
    const file = event.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        className="border border-2 border-dashed rounded-3 p-4 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <CIcon icon={cilCloudUpload} size="xl" className="text-body-secondary mb-2" />
        <div className="mb-2 text-body-secondary">Drop Excel file here</div>
        <CButton
          type="button"
          color="primary"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Browse file
        </CButton>
        <div className="small text-body-secondary mt-2">.xlsx or .csv · up to 10 MB · max 1,000 rows</div>
        <input
          ref={inputRef}
          type="file"
          accept={STUDENT_IMPORT_ACCEPT}
          className="d-none"
          onChange={(event) => handleFile(event.target.files?.[0])}
          disabled={disabled}
        />
      </div>
      {error ? (
        <CAlert color="danger" className="py-2 mt-2 mb-0">
          {error}
        </CAlert>
      ) : null}
    </div>
  )
}

export default UploadDropzone
