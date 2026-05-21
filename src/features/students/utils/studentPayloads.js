// Parent contact fields (parent_guardian_*) are no longer edited from the student form.
// They live on the DB row for backwards compatibility but are managed via the per-student
// Parents card (POST /invites + GET /students/:id/parents). See backend phase2 routes.
export function toStudentCreatePayload(values) {
  const payload = {
    fullName: values.fullName?.trim(),
    monthlyFeeInr: Number(values.monthlyFeeInr || 0),
    feeDueDay:
      values.feeDueDay === '' || values.feeDueDay == null ? null : Number(values.feeDueDay),
    gender: values.gender?.trim() || undefined,
    activityId: values.activityId?.trim() || undefined,
    group: values.group?.trim() || undefined,
    emergencyContactName: values.emergencyContactName?.trim() || undefined,
    emergencyContactPhone: values.emergencyContactPhone?.trim() || undefined,
    medicalNotes: values.medicalNotes?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    status: values.status || undefined,
    batchIds: Array.isArray(values.batchIds) ? values.batchIds : [],
  }

  if (values.dateOfBirth) payload.dateOfBirth = values.dateOfBirth

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

export function toStudentUpdatePayload(values) {
  return toStudentCreatePayload(values)
}

export function fromStudentToFormValues(student) {
  return {
    fullName: student?.full_name || '',
    monthlyFeeInr: student?.monthly_fee_inr ?? 0,
    feeDueDay: student?.fee_due_day ?? '',
    dateOfBirth: student?.date_of_birth ? String(student.date_of_birth).slice(0, 10) : '',
    gender: student?.gender || '',
    activityId: student?.activity_id ? String(student.activity_id) : '',
    group: student?.group_name || '',
    emergencyContactName: student?.emergency_contact_name || '',
    emergencyContactPhone: student?.emergency_contact_phone || '',
    medicalNotes: student?.medical_notes || '',
    notes: student?.notes || '',
    status: student?.status || 'active',
    batchIds: Array.isArray(student?.batch_ids) ? student.batch_ids.map(String) : [],
  }
}
