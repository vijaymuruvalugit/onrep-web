import React, { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilCloudDownload, cilDataTransferDown } from '@coreui/icons'
import studentImportApi from '../api/studentImportApi'
import UploadDropzone from '../components/import/UploadDropzone'
import ImportSummaryCard from '../components/import/ImportSummaryCard'
import ImportPreviewTable from '../components/import/ImportPreviewTable'
import ValidationPanel from '../components/import/ValidationPanel'
import { useStudents } from '../hooks/useStudents'

const StudentImportPage = () => {
  const navigate = useNavigate()
  const { fetchStudents } = useStudents()

  const [downloadLoading, setDownloadLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [executeLoading, setExecuteLoading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [apiError, setApiError] = useState(null)

  const [preview, setPreview] = useState(null)
  const [executeResult, setExecuteResult] = useState(null)

  const handleDownloadTemplate = useCallback(async () => {
    setDownloadLoading(true)
    setApiError(null)
    try {
      const blob = await studentImportApi.downloadTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'onrep-student-import-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setApiError(error?.message || 'Could not download template.')
    } finally {
      setDownloadLoading(false)
    }
  }, [])

  const handleFileSelected = useCallback(async (file, localError) => {
    setUploadError(localError)
    setApiError(null)
    setExecuteResult(null)
    if (!file) {
      if (localError) setPreview(null)
      return
    }

    setPreviewLoading(true)
    try {
      const data = await studentImportApi.previewImport(file)
      setPreview({
        importToken: data.import_token,
        fileName: data.file_name,
        summary: data.summary,
        rows: data.rows || [],
      })
    } catch (error) {
      setPreview(null)
      setApiError(error?.message || 'Preview failed.')
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const handleExecute = useCallback(async () => {
    if (!preview?.importToken) return
    setExecuteLoading(true)
    setApiError(null)
    try {
      const result = await studentImportApi.executeImport(preview.importToken)
      setExecuteResult(result)
      if (result.imported_count > 0) {
        await fetchStudents({})
      }
    } catch (error) {
      setApiError(error?.message || 'Import failed.')
    } finally {
      setExecuteLoading(false)
    }
  }, [preview, fetchStudents])

  const readyCount = preview?.summary?.ready_to_import ?? 0
  const showPreview = preview && !executeResult

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <CButton as={Link} to="/coach/students" color="link" className="ps-0 text-decoration-none">
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to students
          </CButton>
          <h4 className="mb-0">Upload students via Excel</h4>
          <p className="text-body-secondary small mb-0">
            Download the template, fill student details, upload, review issues, then import valid rows.
          </p>
        </div>
        <CButton color="primary" variant="outline" onClick={handleDownloadTemplate} disabled={downloadLoading}>
          {downloadLoading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCloudDownload} className="me-1" />}
          Download Excel template
        </CButton>
      </div>

      {apiError ? <CAlert color="danger">{apiError}</CAlert> : null}

      {executeResult ? (
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Import complete</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={4}>
                <div className="fs-3 fw-bold text-success">{executeResult.imported_count ?? 0}</div>
                <div className="small text-body-secondary">Students imported</div>
              </CCol>
              <CCol md={4}>
                <div className="fs-3 fw-bold">{executeResult.skipped_count ?? 0}</div>
                <div className="small text-body-secondary">Skipped</div>
              </CCol>
              <CCol md={4}>
                <div className="fs-3 fw-bold text-warning">{executeResult.warning_count ?? 0}</div>
                <div className="small text-body-secondary">Warnings (during preview)</div>
              </CCol>
            </CRow>
            {(executeResult.skipped || []).length > 0 ? (
              <CAlert color="warning" className="small">
                Some rows were skipped. Fix your spreadsheet and upload again to add them.
              </CAlert>
            ) : null}
            <div className="d-flex gap-2">
              <CButton color="primary" onClick={() => navigate('/coach/students')}>
                View students
              </CButton>
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => {
                  setExecuteResult(null)
                  setPreview(null)
                  setUploadError(null)
                }}
              >
                Import another file
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      ) : null}

      {!executeResult ? (
        <CRow className="g-3">
          <CCol lg={5}>
            <CCard>
              <CCardHeader>
                <strong>Upload file</strong>
              </CCardHeader>
              <CCardBody>
                <UploadDropzone
                  onFileSelected={handleFileSelected}
                  disabled={previewLoading || executeLoading}
                  error={uploadError}
                />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol lg={7}>
            {showPreview ? (
              <>
                <ImportSummaryCard
                  summary={preview.summary}
                  fileName={preview.fileName}
                  title="Dry-run summary"
                />
                <CCard className="mb-3">
                  <CCardHeader>
                    <strong>Issues</strong>
                  </CCardHeader>
                  <CCardBody>
                    <ValidationPanel rows={preview.rows} />
                  </CCardBody>
                </CCard>
                <ImportPreviewTable rows={preview.rows} loading={previewLoading} />
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <CButton
                    color="primary"
                    disabled={readyCount === 0 || executeLoading}
                    onClick={handleExecute}
                  >
                    {executeLoading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Importing…
                      </>
                    ) : (
                      <>
                        <CIcon icon={cilDataTransferDown} className="me-1" />
                        Import {readyCount} student{readyCount === 1 ? '' : 's'}
                      </>
                    )}
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    disabled={executeLoading}
                    onClick={() => {
                      setPreview(null)
                      setUploadError(null)
                    }}
                  >
                    Upload a different file
                  </CButton>
                </div>
                {readyCount === 0 ? (
                  <CAlert color="warning" className="mt-2 mb-0 small">
                    No rows are ready to import. Fix errors in your file and upload again.
                  </CAlert>
                ) : null}
              </>
            ) : (
              <CCard>
                <CCardBody className="text-body-secondary">
                  {previewLoading ? (
                    <div className="text-center py-5">
                      <CSpinner className="mb-2" />
                      <div>Checking your file…</div>
                    </div>
                  ) : (
                    <div className="py-4">
                      Upload a filled template to see how many students are ready to import and which rows need
                      fixes.
                    </div>
                  )}
                </CCardBody>
              </CCard>
            )}
          </CCol>
        </CRow>
      ) : null}
    </>
  )
}

export default StudentImportPage
