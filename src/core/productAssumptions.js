/**
 * Product assumptions (explicit decisions — see Activities migration audit).
 *
 * CURRENT: Students are modeled with a single `activity_id` FK per row; operations assume
 * one primary activity workspace per student record for payments and reporting. Multi-activity enrollment
 * per student (one person, multiple simultaneous activity workspaces) is NOT fully modeled — requires
 * product sign-off, join tables, payment allocation, and likely `payment_obligations.activity_id`
 * before Phase 2D-style schema work.
 */

export const STUDENT_ACTIVITY_MODEL = 'single_primary_activity_per_student_record'
