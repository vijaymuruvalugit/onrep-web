import * as yup from 'yup'

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
})
