import * as yup from 'yup'

const passwordFields = {
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
}

/** Invite already has parent email + name — only password needed. */
export const parentInvitePasswordOnlySchema = yup.object(passwordFields)

/** Invite has email; parent may still need to enter display name. */
export const parentInvitePasswordAndNameSchema = yup.object({
  name: yup.string().trim().min(2, 'Enter your name').required('Name is required'),
  ...passwordFields,
})

export const parentInviteAcceptSchema = yup.object({
  name: yup.string().trim().min(2, 'Enter your name').required('Name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  ...passwordFields,
})
