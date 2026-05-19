import React, { useMemo } from 'react'
import {
  CCloseButton,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
} from '@coreui/react'
import PhaseCaptureRenderer from './PhaseCaptureRenderer'
import { drawerCaptureItems, entryValueForField, uiRoleLabel } from '../../utils/phaseCaptureDisplay'

export default function PhaseAthleteDetailDrawer({
  visible,
  athlete,
  captureItems = [],
  entries = [],
  inlineItemIds = [],
  disabled = false,
  onClose,
  onValueChange,
}) {
  const athleteId = athlete ? String(athlete.id) : ''
  const name = athlete?.full_name || athlete?.fullName || 'Athlete'

  const drawerItems = useMemo(
    () => drawerCaptureItems(captureItems, inlineItemIds),
    [captureItems, inlineItemIds]
  )

  return (
    <COffcanvas placement="end" visible={visible} onHide={onClose} className="phase-detail-drawer">
      <COffcanvasHeader className="border-bottom">
        <COffcanvasTitle>{name}</COffcanvasTitle>
        <CCloseButton onClick={onClose} />
      </COffcanvasHeader>
      <COffcanvasBody>
        {drawerItems.length === 0 ? (
          <p className="small text-body-secondary">No additional capture for this phase.</p>
        ) : (
          drawerItems.map((item) => (
            <div key={item.id} className="phase-detail-drawer__item mb-3">
              <div className="small text-body-secondary mb-1">
                {uiRoleLabel(item.configurationJson?.uiRole)} · {item.label}
              </div>
              <PhaseCaptureRenderer
                item={item}
                compact={false}
                disabled={disabled}
                valueJson={entryValueForField(entries, athleteId, item.id)}
                onChange={(v) => onValueChange?.(athleteId, item.id, v)}
              />
            </div>
          ))
        )}
      </COffcanvasBody>
    </COffcanvas>
  )
}
