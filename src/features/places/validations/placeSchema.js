import * as yup from 'yup'

const placeSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  address: yup.string().trim().nullable(),
  notes: yup.string().trim().nullable(),
  sortOrder: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === '' || orig == null ? null : v))
    .typeError('Sort order must be a number'),
  latitude: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === '' || orig == null ? null : v))
    .min(-90)
    .max(90),
  longitude: yup
    .number()
    .nullable()
    .transform((v, orig) => (orig === '' || orig == null ? null : v))
    .min(-180)
    .max(180),
  googlePlaceId: yup.string().trim().nullable(),
})

export default placeSchema
