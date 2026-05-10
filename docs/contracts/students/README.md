# Students Contract Snapshot

This folder freezes the Students API contract baseline used during migration from `ezyplay-frontend` to `onrep-admin`.

## Source References
- `ezyplay-frontend/src/core/services/students/studentService.js`
- `ezyplay-frontend/src/modules/students/components/StudentFormModal.js`
- `ezyplay-frontend/src/modules/students/screens/CoachStudentListScreen.js`
- `ezyplay-frontend/src/screens/coach/StudentListScreen.js`
- `ezyplay-frontend/src/screens/coach/AddEditStudentScreen.js`

## Baseline Endpoints
- `GET /students` -> `{ students: StudentRow[] }`
- `GET /students/:id` -> `{ student: StudentRow }`
- `POST /students` -> `{ student: StudentRow }`
- `PATCH /students/:id` -> `{ student: StudentRow }`

## Optional/Nullable Behavior
- Optional in request payloads: `dateOfBirth`, `group`, `batchIds`, parent/emergency contact fields, `medicalNotes`, `notes`, `sendParentInviteNow`
- Optional/null in response rows: `date_of_birth`, `group_name`, `parent_guardian_*`, `medical_notes`, `notes`, `batch_ids`, payment-related fields
- Some environments may not support `sendParentInviteNow` and/or `batchIds`; source behavior retries without those fields

## Pagination Metadata Shape
- Current baseline for coach students list: **not returned** by `GET /students`
- If backend adds pagination later, expected safe shape:
  - `page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`
  - client must tolerate missing metadata
