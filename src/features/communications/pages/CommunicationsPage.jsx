import React, { useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPaperPlane, cilEnvelopeOpen, cilEnvelopeLetter, cilCloudUpload } from '@coreui/icons'
import { communicationsApi } from '../api/communicationsApi'
import { useAuth } from '../../auth/hooks/useAuth'

const AUDIENCE_OPTIONS = [
  { value: 'academy',           label: 'Entire Academy' },
  { value: 'batch',             label: 'Batch' },
  { value: 'multi_batch',       label: 'Multiple Batches' },
  { value: 'selected_students', label: 'Selected Students' },
  { value: 'selected_parents',  label: 'Selected Parents' },
  { value: 'selected_coaches',  label: 'Selected Coaches' },
]

const MESSAGE_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'reminder',     label: 'Reminder' },
]

const AUDIENCE_LABELS = {
  academy:           'Entire Academy',
  batch:             'Batch',
  multi_batch:       'Multiple Batches',
  selected_students: 'Selected Students',
  selected_parents:  'Selected Parents',
  selected_coaches:  'Selected Coaches',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

// ── Inbox tab ──────────────────────────────────────────────────────────────────

function InboxTab() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    communicationsApi.getInbox({ limit: 50 })
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center p-4"><CSpinner /></div>

  if (selected) {
    return (
      <div>
        <CButton color="link" className="mb-3 ps-0" onClick={() => setSelected(null)}>
          ← Back to inbox
        </CButton>
        <h5 className="fw-bold">{selected.title}</h5>
        <small className="text-muted">From {selected.sender_name} · {formatDate(selected.published_at)}</small>
        <CBadge color="secondary" className="ms-2 text-uppercase" style={{ fontSize: 10 }}>{selected.message_type?.replace('_', ' ')}</CBadge>
        <hr />
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{selected.body}</p>
        {Array.isArray(selected.attachments) && selected.attachments.length > 0 && (
          <div className="mt-3">
            <h6 className="text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>Attachments</h6>
            {selected.attachments.map((att) => (
              <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                className="d-flex align-items-center gap-2 mb-2 text-decoration-none"
                style={{ background: '#f8f9fa', borderRadius: 8, padding: '10px 14px' }}>
                <CIcon icon={cilCloudUpload} size="sm" />
                <span>{att.fileName}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (messages.length === 0) return <p className="text-muted text-center mt-4">No messages in inbox.</p>

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell></CTableHeaderCell>
          <CTableHeaderCell>Title</CTableHeaderCell>
          <CTableHeaderCell>From</CTableHeaderCell>
          <CTableHeaderCell>Type</CTableHeaderCell>
          <CTableHeaderCell>Date</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {messages.map((msg) => (
          <CTableRow key={msg.id} style={{ cursor: 'pointer', fontWeight: msg.opened_at ? 'normal' : 700 }}
            onClick={() => {
              setSelected(msg)
              if (!msg.opened_at) communicationsApi.getMessage(msg.id).catch(() => {})
            }}>
            <CTableDataCell>
              {!msg.opened_at && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#FF6B5B', display: 'inline-block' }} />}
            </CTableDataCell>
            <CTableDataCell>{msg.title}</CTableDataCell>
            <CTableDataCell className="text-muted">{msg.sender_name}</CTableDataCell>
            <CTableDataCell>
              <CBadge color="secondary" className="text-uppercase" style={{ fontSize: 10 }}>{msg.message_type?.replace('_', ' ')}</CBadge>
            </CTableDataCell>
            <CTableDataCell className="text-muted">{formatDate(msg.published_at)}</CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

// ── Sent tab ───────────────────────────────────────────────────────────────────

function SentTab() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    communicationsApi.getSent({ limit: 50 })
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center p-4"><CSpinner /></div>

  if (selected) {
    return (
      <div>
        <CButton color="link" className="mb-3 ps-0" onClick={() => setSelected(null)}>← Back to sent</CButton>
        <h5 className="fw-bold">{selected.title}</h5>
        <small className="text-muted">
          {AUDIENCE_LABELS[selected.audience_type]} · {selected.recipient_count} recipient{selected.recipient_count !== 1 ? 's' : ''}
          {' '}· {selected.opened_count} opened · {formatDate(selected.published_at || selected.created_at)}
        </small>
        <hr />
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{selected.body}</p>
      </div>
    )
  }

  if (messages.length === 0) return <p className="text-muted text-center mt-4">No sent messages yet.</p>

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Title</CTableHeaderCell>
          <CTableHeaderCell>Audience</CTableHeaderCell>
          <CTableHeaderCell>Recipients</CTableHeaderCell>
          <CTableHeaderCell>Opened</CTableHeaderCell>
          <CTableHeaderCell>Date</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {messages.map((msg) => (
          <CTableRow key={msg.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(msg)}>
            <CTableDataCell className="fw-semibold">{msg.title}</CTableDataCell>
            <CTableDataCell className="text-muted">{AUDIENCE_LABELS[msg.audience_type] || msg.audience_type}</CTableDataCell>
            <CTableDataCell>{msg.recipient_count}</CTableDataCell>
            <CTableDataCell>{msg.opened_count}</CTableDataCell>
            <CTableDataCell className="text-muted">{formatDate(msg.published_at || msg.created_at)}</CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

// ── Compose tab ────────────────────────────────────────────────────────────────

function ComposeTab({ onSent }) {
  const [messageType, setMessageType] = useState('announcement')
  const [audienceType, setAudienceType] = useState('academy')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [allowReplies, setAllowReplies] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploadingAtt, setUploadingAtt] = useState(false)
  const fileInputRef = useRef(null)

  // Audience lists
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [parents, setParents] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedBatchIds, setSelectedBatchIds] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [selectedParentIds, setSelectedParentIds] = useState([])
  const [selectedCoachIds, setSelectedCoachIds] = useState([])

  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    communicationsApi.getComposeBatches().then(setBatches).catch(() => {})
  }, [])

  useEffect(() => {
    if (audienceType === 'selected_students' && students.length === 0)
      communicationsApi.getComposeStudents().then(setStudents).catch(() => {})
    if (audienceType === 'selected_parents' && parents.length === 0)
      communicationsApi.getComposeParents().then(setParents).catch(() => {})
    if (audienceType === 'selected_coaches' && coaches.length === 0)
      communicationsApi.getComposeCoaches().then(setCoaches).catch(() => {})
  }, [audienceType])

  const toggleId = (list, setList, id) => {
    setList((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const buildAudienceMeta = () => {
    if (audienceType === 'batch') return { batchIds: selectedBatchIds.slice(0, 1) }
    if (audienceType === 'multi_batch') return { batchIds: selectedBatchIds }
    if (audienceType === 'selected_students') return { studentIds: selectedStudentIds }
    if (audienceType === 'selected_parents') return { userIds: selectedParentIds }
    if (audienceType === 'selected_coaches') return { userIds: selectedCoachIds }
    return {}
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAtt(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await communicationsApi.uploadAttachment(form)
      setAttachments((prev) => [...prev, result])
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Upload failed')
    } finally {
      setUploadingAtt(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const send = async () => {
    setError(null)
    if (!title.trim()) { setError('Title is required.'); return }
    if (!body.trim()) { setError('Message body is required.'); return }
    setSending(true)
    try {
      await communicationsApi.sendMessage({
        messageType,
        title: title.trim(),
        body: body.trim(),
        audienceType,
        audienceMeta: buildAudienceMeta(),
        allowReplies,
        scheduledFor: scheduledFor || undefined,
        attachments: attachments.map((a) => ({ fileUrl: a.key, fileName: a.fileName, mimeType: a.mimeType })),
      })
      onSent?.()
      setTitle(''); setBody(''); setAttachments([]); setScheduledFor('')
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const needsSub = ['batch','multi_batch','selected_students','selected_parents','selected_coaches'].includes(audienceType)
  const subItems = audienceType === 'batch' || audienceType === 'multi_batch' ? batches
    : audienceType === 'selected_students' ? students
    : audienceType === 'selected_parents' ? parents
    : coaches
  const subSelected = audienceType === 'batch' || audienceType === 'multi_batch' ? selectedBatchIds
    : audienceType === 'selected_students' ? selectedStudentIds
    : audienceType === 'selected_parents' ? selectedParentIds
    : selectedCoachIds
  const subToggle = audienceType === 'batch' || audienceType === 'multi_batch'
    ? (id) => audienceType === 'batch' ? setSelectedBatchIds([id]) : toggleId(selectedBatchIds, setSelectedBatchIds, id)
    : audienceType === 'selected_students' ? (id) => toggleId(selectedStudentIds, setSelectedStudentIds, id)
    : audienceType === 'selected_parents' ? (id) => toggleId(selectedParentIds, setSelectedParentIds, id)
    : (id) => toggleId(selectedCoachIds, setSelectedCoachIds, id)

  return (
    <CForm>
      {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

      <CRow className="mb-3">
        <CCol md={6}>
          <CFormLabel className="fw-semibold">Message type</CFormLabel>
          <CFormSelect value={messageType} onChange={(e) => setMessageType(e.target.value)}>
            {MESSAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </CFormSelect>
        </CCol>
        <CCol md={6}>
          <CFormLabel className="fw-semibold">Send to</CFormLabel>
          <CFormSelect value={audienceType} onChange={(e) => { setAudienceType(e.target.value); setSelectedBatchIds([]) }}>
            {AUDIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </CFormSelect>
        </CCol>
      </CRow>

      {needsSub && (
        <div className="mb-3 p-3 rounded" style={{ background: '#f8f9fa', maxHeight: 200, overflowY: 'auto' }}>
          <small className="text-muted d-block mb-2 text-uppercase fw-bold" style={{ fontSize: 11, letterSpacing: 0.8 }}>
            Select {audienceType.replace('_', ' ')}
          </small>
          {subItems.length === 0
            ? <small className="text-muted">Loading…</small>
            : subItems.map((item) => (
              <CFormCheck
                key={item.id}
                id={`sub-${item.id}`}
                label={item.name}
                checked={subSelected.includes(item.id)}
                onChange={() => subToggle(item.id)}
                className="mb-1"
                type={audienceType === 'batch' ? 'radio' : 'checkbox'}
              />
            ))
          }
        </div>
      )}

      <div className="mb-3">
        <CFormLabel className="fw-semibold">Title <small className="text-muted fw-normal">(max 120 chars)</small></CFormLabel>
        <CFormInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Tomorrow's session starts at 5:30 AM"
          maxLength={120}
        />
        <small className="text-muted">{title.length}/120</small>
      </div>

      <div className="mb-3">
        <CFormLabel className="fw-semibold">Message <small className="text-muted fw-normal">(max 2000 chars)</small></CFormLabel>
        <CFormTextarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message here…"
          maxLength={2000}
          style={{ resize: 'vertical' }}
        />
        <small className="text-muted">{body.length}/2000</small>
      </div>

      {/* Attachments */}
      <div className="mb-3">
        <CFormLabel className="fw-semibold">Attachments</CFormLabel>
        {attachments.map((att) => (
          <div key={att.key} className="d-flex align-items-center gap-2 mb-1 p-2 rounded" style={{ background: '#f8f9fa' }}>
            <span className="flex-grow-1 text-truncate" style={{ fontSize: 13 }}>{att.fileName}</span>
            <CButton size="sm" color="light" onClick={() => setAttachments((prev) => prev.filter((a) => a.key !== att.key))}>✕</CButton>
          </div>
        ))}
        <div className="mt-2">
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
          <CButton color="light" size="sm" disabled={uploadingAtt} onClick={() => fileInputRef.current?.click()}>
            {uploadingAtt ? <CSpinner size="sm" /> : <><CIcon icon={cilCloudUpload} className="me-1" />Add attachment</>}
          </CButton>
          <small className="text-muted ms-2">PDF, image, Word, Excel · max 20 MB</small>
        </div>
      </div>

      {/* Scheduled for */}
      <div className="mb-3">
        <CFormLabel className="fw-semibold">Schedule for (optional)</CFormLabel>
        <CFormInput type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} style={{ maxWidth: 280 }} />
        <small className="text-muted">Leave blank to send immediately.</small>
      </div>

      {/* Allow replies */}
      <div className="mb-4 d-flex align-items-center gap-3">
        <CFormSwitch id="allowReplies" label="Allow replies" checked={allowReplies} onChange={(e) => setAllowReplies(e.target.checked)} />
        <small className="text-muted">Off by default — turn on for messages where you expect a response.</small>
      </div>

      <CButton color="primary" disabled={sending} onClick={send} className="px-4">
        {sending ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilPaperPlane} className="me-2" />}
        {sending ? 'Sending…' : 'Send message'}
      </CButton>
    </CForm>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [sentAt, setSentAt] = useState(null)

  return (
    <CRow>
      <CCol>
        <CCard>
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-bold">Communications</h5>
          </CCardHeader>
          <CCardBody>
            {sentAt && (
              <CAlert color="success" dismissible onClose={() => setSentAt(null)} className="mb-3">
                Message sent successfully.
              </CAlert>
            )}
            <CNav variant="tabs" className="mb-4">
              <CNavItem>
                <CNavLink active={activeTab === 'inbox'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('inbox') }}>
                  <CIcon icon={cilEnvelopeOpen} className="me-1" />Inbox
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink active={activeTab === 'sent'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('sent') }}>
                  <CIcon icon={cilEnvelopeLetter} className="me-1" />Sent
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink active={activeTab === 'compose'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('compose') }}>
                  <CIcon icon={cilPaperPlane} className="me-1" />Compose
                </CNavLink>
              </CNavItem>
            </CNav>

            {activeTab === 'inbox'   && <InboxTab />}
            {activeTab === 'sent'    && <SentTab />}
            {activeTab === 'compose' && (
              <ComposeTab onSent={() => { setSentAt(Date.now()); setActiveTab('sent') }} />
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
