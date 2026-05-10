/**
 * Helpers for "click row to open detail" pattern used on list pages.
 *
 * Rows should:
 *   - left-click → navigate via react-router
 *   - cmd/ctrl/shift-click or middle-click → leave default behavior
 *     (the inner `<Link>` opens a new tab)
 *   - ignore clicks originating from interactive children (buttons, links,
 *     inputs, dropdowns) so per-row controls keep working
 */

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="button"]'

export function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1
}

export function isInteractiveTarget(event) {
  const target = event.target
  if (!(target instanceof Element)) return false
  return !!target.closest(INTERACTIVE_SELECTOR)
}

/**
 * Returns props to spread on a `<tr>` (or any clickable container) so the user
 * can click anywhere on the row to navigate, while preserving new-tab behavior
 * and per-row buttons.
 *
 * Example:
 *   const rowProps = useRowNavProps(navigate, `/coach/students/${id}`)
 *   <CTableRow {...rowProps}>...</CTableRow>
 */
export function buildRowNavProps(navigate, to) {
  return {
    role: 'link',
    style: { cursor: 'pointer' },
    onClick(event) {
      if (isModifiedClick(event)) return
      if (isInteractiveTarget(event)) return
      navigate(to)
    },
  }
}

export default buildRowNavProps
