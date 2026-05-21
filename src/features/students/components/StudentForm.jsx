import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave } from '@coreui/icons'
import studentSchema from '../validations/studentSchema'
import { getWorkspaceDisplay } from '../../../core/activityWorkspace/activityDisplay'

const defaultValues = {
  fullName: '',
  monthlyFeeInr: 0,
  feeDueDay: '',
  dateOfBirth: '',
  gender: '',
  activityId: '',
  group: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
  notes: '',
  status: 'active',
}

const StudentForm = ({ title, subtitle, submitLabel, initialValues, saving, error, onSubmit }) => {
  const navigate = useNavigate()
  const workspaceActivities = useSelector((state) => state.workspace.activities)
  const activeActivityId = useSelector((state) => state.workspace.activeActivityId)
  const { register, handleSubmit, formState, reset, setValue } = useForm({
    resolver: yupResolver(studentSchema),
    defaultValues,
  })

  const { errors, isDirty } = formState

  useEffect(() => {
    if (initialValues) {
      reset({
        ...defaultValues,
        ...initialValues,
      })
    }
  }, [initialValues, reset])

  useEffect(() => {
    if (initialValues) return
    if (activeActivityId && workspaceActivities?.some((a) => a.id === activeActivityId)) {
      setValue('activityId', activeActivityId, { shouldDirty: false })
    }
  }, [initialValues, activeActivityId, workspaceActivities, setValue])

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [isDirty])

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    navigate(-1)
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong>{title}</strong>
          {subtitle ? <div className="small text-body-secondary">{subtitle}</div> : null}
        </div>
        <CButton color="light" variant="outline" onClick={handleCancel}>
          <CIcon icon={cilArrowLeft} className="me-1" />
          Back
        </CButton>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit(onSubmit)} noValidate>
          {error?.message ? <CAlert color="danger">{error.message}</CAlert> : null}
          <CRow className="g-3 mb-2">
            <CCol md={6}>
              <CFormLabel htmlFor="fullName">Full name</CFormLabel>
              <CFormInput
                id="fullName"
                invalid={Boolean(errors.fullName)}
                {...register('fullName')}
              />
              {errors.fullName ? (
                <small className="text-danger">{errors.fullName.message}</small>
              ) : null}
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="dateOfBirth">Date of birth</CFormLabel>
              <CFormInput
                id="dateOfBirth"
                type="date"
                invalid={Boolean(errors.dateOfBirth)}
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth ? (
                <small className="text-danger">{errors.dateOfBirth.message}</small>
              ) : null}
            </CCol>
            <CCol md={3}>
              <CFormLabel htmlFor="gender">Gender</CFormLabel>
              <CFormSelect id="gender" {...register('gender')}>
                <option value="">Select</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="Other">Other</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="g-3 mb-2">
            <CCol md={4}>
              <CFormLabel htmlFor="activityId">Activity workspace</CFormLabel>
              <CFormSelect
                id="activityId"
                invalid={Boolean(errors.activityId)}
                {...register('activityId')}
              >
                <option value="">Use academy default</option>
                {(workspaceActivities || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {getWorkspaceDisplay(a).label}
                  </option>
                ))}
              </CFormSelect>
              {errors.activityId ? (
                <small className="text-danger">{errors.activityId.message}</small>
              ) : null}
              <div className="small text-body-secondary mt-1">
                Which enabled academy activity this student belongs to for skating and portal flows
                (often Skating today). <code className="small">Group label</code> below is optional.
              </div>
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="group">Group label (optional)</CFormLabel>
              <CFormInput id="group" {...register('group')} />
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="status">Enrollment status</CFormLabel>
              <CFormSelect id="status" {...register('status')}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="g-3 mb-2">
            <CCol md={4}>
              <CFormLabel htmlFor="monthlyFeeInr">Monthly fee override (INR)</CFormLabel>
              <CInputGroup>
                <CInputGroupText>₹</CInputGroupText>
                <CFormInput
                  id="monthlyFeeInr"
                  type="number"
                  min="0"
                  invalid={Boolean(errors.monthlyFeeInr)}
                  {...register('monthlyFeeInr')}
                />
              </CInputGroup>
              {errors.monthlyFeeInr ? (
                <small className="text-danger">{errors.monthlyFeeInr.message}</small>
              ) : (
                <div className="small text-body-secondary mt-1">
                  Set to 0 to use the batch fee. Enter an amount only when this student pays
                  differently.
                </div>
              )}
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="feeDueDay">Payment due day</CFormLabel>
              <CFormInput
                id="feeDueDay"
                type="number"
                min="1"
                max="31"
                placeholder="Use academy default"
                invalid={Boolean(errors.feeDueDay)}
                {...register('feeDueDay')}
              />
              {errors.feeDueDay ? (
                <small className="text-danger">{errors.feeDueDay.message}</small>
              ) : (
                <div className="small text-body-secondary mt-1">
                  Leave blank to use the academy payment setting.
                </div>
              )}
            </CCol>
          </CRow>

          <CRow className="g-3 mb-2">
            <CCol md={6}>
              <CFormLabel htmlFor="emergencyContactName">Emergency contact name</CFormLabel>
              <CFormInput id="emergencyContactName" {...register('emergencyContactName')} />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="emergencyContactPhone">Emergency contact phone</CFormLabel>
              <CFormInput
                id="emergencyContactPhone"
                invalid={Boolean(errors.emergencyContactPhone)}
                {...register('emergencyContactPhone')}
              />
              {errors.emergencyContactPhone ? (
                <small className="text-danger">{errors.emergencyContactPhone.message}</small>
              ) : null}
            </CCol>
          </CRow>

          <CRow className="g-3 mb-2">
            <CCol md={6}>
              <CFormLabel htmlFor="medicalNotes">Medical notes</CFormLabel>
              <CFormInput id="medicalNotes" {...register('medicalNotes')} />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="notes">Internal notes</CFormLabel>
              <CFormInput id="notes" {...register('notes')} />
            </CCol>
          </CRow>

          <CAlert color="info" className="small mb-3">
            <strong>Parents are managed separately.</strong> Save this student, then add one or more
            parents from the student detail page using <em>Invite parent</em>. Each parent gets
            their own login and can see fees, attendance and updates for this child.
          </CAlert>

          <div className="d-flex justify-content-end gap-2">
            <CButton type="button" color="light" variant="outline" onClick={handleCancel}>
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={saving}>
              {saving ? (
                <CSpinner size="sm" className="me-2" />
              ) : (
                <CIcon icon={cilSave} className="me-1" />
              )}
              {submitLabel}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default StudentForm
