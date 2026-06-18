# Students Contract Snapshot

This folder documents the Students API contract currently used by `onrep-admin`.

## Source References
- `onrep-admin/src/features/students/api/studentsApi.js`
- `onrep-admin/src/features/students/utils/studentPayloads.js`
- `onrep-admin/src/features/students/utils/studentMappers.js`
- `onrep-admin/src/features/students/pages/StudentsListPage.jsx`
- `onrep-admin/src/features/students/pages/StudentCreatePage.jsx`
- `onrep-admin/src/features/students/api/studentParentsApi.js`

## Baseline Endpoints
- `GET /students?page=&pageSize=` -> `{ students: StudentRow[], pagination? }`
- `GET /students/:id` -> `{ student: StudentRow }`
- `POST /students` -> `{ student: StudentRow }`
- `PATCH /students/:id` -> `{ student: StudentRow }`
- `POST /invites` -> parent invite flow from student detail, not part of student create/update payloads

## Optional/Nullable Behavior
- Request payloads are camelCase and include `activityId`, `fullName`, `monthlyFeeInr`, `feeDueDay`, `status`, optional `dateOfBirth`, `gender`, `group`, `batchIds`, emergency contact fields, `medicalNotes`, and `notes`.
- Parent/guardian fields are not edited on create/update in `onrep-admin`; parent linking/invites happen through `/invites` and `studentParentsApi`.
- Optional/null in response rows: `date_of_birth`, `group_name`, `parent_guardian_*`, `medical_notes`, `notes`, `batch_ids`, payment-related fields, and pagination metadata.
- Create retry behavior may drop `batchIds` if the first create attempt fails against an environment that does not support batch assignment on create.

## Pagination Metadata Shape
- Current coach students list sends `page` / `pageSize` and tolerates missing or null `pagination`.
- Safe shape when returned:
  - `page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`
  - client must tolerate missing metadata
