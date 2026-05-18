import * as yup from 'yup'

export const parentInviteAcceptSchema = yup.object({
  name: yup.string().trim().min(2, 'Enter your name').required('Name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
})
