/**
 * Pure helpers for confirmed race results display in SessionDetailDrawer (Slice 1E).
 * Kept free of React so Vitest can cover too_close / loading states without JSX.
 */

export function isRacePlaceSuppressed(row) {
  if (!row || typeof row !== 'object') return false;
  return (
    row.place_suppressed === true ||
    row.meta?.place_suppressed === true ||
    row.too_close === true ||
    row.meta?.too_close === true ||
    Boolean(row.place_note || row.meta?.place_note)
  );
}

/**
 * @returns {string} display place label — "—" when suppressed or missing rank
 */
export function formatRacePlaceLabel(row) {
  if (isRacePlaceSuppressed(row)) return '—';
  const rank = row?.finishRank ?? row?.finish_rank;
  return rank != null ? `#${rank}` : '—';
}

/**
 * @returns {string|null} public ambiguity note, or null when place is confident
 */
export function racePlaceAmbiguityNote(row) {
  if (!isRacePlaceSuppressed(row)) return null;
  return row?.place_note || row?.meta?.place_note || 'Too close to call';
}

/**
 * Discriminate confirmed-results panel state (loading ≠ error ≠ empty ≠ rows).
 * @returns {'loading'|'error'|'empty'|'rows'}
 */
export function resolveConfirmedRaceResultsPanelState({ loading, error, rows }) {
  if (loading) return 'loading';
  if (error) return 'error';
  if (!rows || rows.length === 0) return 'empty';
  return 'rows';
}
