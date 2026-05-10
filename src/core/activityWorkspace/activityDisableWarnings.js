import { hasCapability } from '@onrep/contracts'

/** Owner-facing consequence copy when removing an enabled activity. */
export function getRemoveActivityConsequenceMessage(type) {
  const t = String(type || '').toLowerCase()
  if (hasCapability(t, 'skatingRoutes')) {
    return (
      'Removing Skating hides skating schedules, classes, attendance, skills, races, and coaching tools for this workspace until you enable Skating again. ' +
      'Data stays in your database, but coaches may not see skating workflows while it is turned off.'
    )
  }
  return 'Removing this activity hides its workspace until you enable it again. Scoped operational data stays in the database.'
}
