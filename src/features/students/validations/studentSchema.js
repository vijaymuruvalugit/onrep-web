import * as yup from 'yup'

const phoneRegex = /^[0-9+\-\s()]{7,20}$/
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const studentSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required'),
  monthlyFeeInr: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? 0 : value))
    .min(0, 'Monthly fee cannot be negative')
    .required('Monthly fee is required'),
  feeDueDay: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .integer('Due day must be a whole number')
    .min(1, 'Due day must be between 1 and 31')
    .max(31, 'Due day must be between 1 and 31'),
  dateOfBirth: yup
    .string()
    .nullable()
    .test(
      'valid-date',
      'Date must be YYYY-MM-DD',
      (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
    ),
  gender: yup.string().trim().nullable(),
  activityId: yup
    .string()
    .trim()
    .nullable()
    .test('uuid', 'Invalid activity', (v) => !v || uuidRe.test(v)),
  group: yup.string().trim().nullable(),
  emergencyContactName: yup.string().trim().nullable(),
  emergencyContactPhone: yup
    .string()
    .trim()
    .nullable()
    .test('valid-phone', 'Enter a valid phone number', (value) => !value || phoneRegex.test(value)),
  medicalNotes: yup.string().trim().nullable(),
  notes: yup.string().trim().nullable(),
  status: yup.string().trim().nullable(),
  batchIds: yup.array().of(yup.string().trim()),
})

export default studentSchema
