/**
 * Short labels for athlete chips. First name when unique in the group;
 * otherwise first name + last initial so peers with the same first name
 * (Aarav D / Aarav G) are distinguishable.
 */

export function parseAthleteNameParts(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return {
    first: parts[0] || '',
    last: parts.length > 1 ? parts[parts.length - 1] : '',
    parts,
  }
}

export function athleteInitials(name) {
  const { first, last } = parseAthleteNameParts(name)
  if (!first) return '?'
  if (last) return `${first[0]}${last[0]}`.toUpperCase()
  return first.slice(0, 2).toUpperCase()
}

export function shortAthleteLabel(name, cohortNames = []) {
  const { first, last } = parseAthleteNameParts(name)
  if (!first) return 'Student'
  const firstLower = first.toLowerCase()
  const sameFirst = (cohortNames || []).filter((n) => {
    const other = parseAthleteNameParts(n)
    return other.first.toLowerCase() === firstLower
  }).length
  if (sameFirst > 1 && last) {
    return `${first} ${last[0].toUpperCase()}.`
  }
  return first
}

export function athleteNameOf(athlete) {
  if (!athlete || typeof athlete !== 'object') return ''
  return (
    athlete.student_full_name ||
    athlete.fullName ||
    athlete.full_name ||
    athlete.name ||
    [athlete.first_name, athlete.last_name].filter(Boolean).join(' ') ||
    ''
  )
}

export function cohortNamesFromAthletes(athletes = []) {
  return (athletes || []).map((a) => athleteNameOf(a)).filter(Boolean)
}
