import * as yup from 'yup'

/** UPI VPA — aligned with backend `UPI_VPA_RE` pattern for UX hints (server validates strictly). */
const upiVpaSchema = yup
  .string()
  .trim()
  .matches(/^[\w.-]+@[\w]+$/, 'Use a valid UPI ID (for example academy@paytm)')

export function manualPaymentSetupSchema() {
  return yup.object({
    upiVpa: upiVpaSchema.required('UPI ID is required'),
  })
}
