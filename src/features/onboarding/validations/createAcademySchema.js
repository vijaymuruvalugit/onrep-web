import * as yup from 'yup'
import { ACTIVITY_TYPES } from '@onrep/contracts'

export const createAcademySchema = yup.object({
  academyName: yup.string().trim().required('Academy name is required').max(200),
  name: yup.string().trim().required('Your name is required').max(120),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  billing_choice: yup
    .string()
    .oneOf(['trial', 'subscribe'], 'Choose trial or subscribe')
    .required(),
  discount_code: yup.string().trim().max(64),
  activities: yup
    .array()
    .of(yup.string().oneOf([...ACTIVITY_TYPES]))
    .min(1, 'Select at least one activity'),
})
