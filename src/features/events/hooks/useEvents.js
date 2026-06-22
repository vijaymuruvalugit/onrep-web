import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchEventsList,
  fetchEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  completeEvent,
  fetchEventRegistrations,
  addEventRegistrations,
  fetchEventResults,
  upsertEventResults,
  fetchEventMedia,
  fetchEventTimeline,
  fetchParentEvents,
  fetchParentUpcomingEvents,
  fetchParentEventDetail,
  submitFamilyRegister,
  submitRsvp,
  clearCurrentEvent,
  clearFamilyRegisterResult,
} from '../slices/eventsSlice'

export default function useEvents() {
  const dispatch = useDispatch()
  const events = useSelector((s) => s.events)

  const loadEvents = useCallback((params) => dispatch(fetchEventsList(params)), [dispatch])
  const loadEvent = useCallback((id) => dispatch(fetchEventDetail(id)), [dispatch])
  const saveCreateEvent = useCallback((payload) => dispatch(createEvent(payload)), [dispatch])
  const saveUpdateEvent = useCallback((id, payload) => dispatch(updateEvent({ id, payload })), [dispatch])
  const removeEvent = useCallback((id) => dispatch(deleteEvent(id)), [dispatch])
  const doPublish = useCallback((id, note) => dispatch(publishEvent({ id, note })), [dispatch])
  const doCancel = useCallback((id, note) => dispatch(cancelEvent({ id, note })), [dispatch])
  const doComplete = useCallback((id, note) => dispatch(completeEvent({ id, note })), [dispatch])

  const loadRegistrations = useCallback((id) => dispatch(fetchEventRegistrations(id)), [dispatch])
  const addRegistrations = useCallback((id, studentIds, status) => dispatch(addEventRegistrations({ id, studentIds, status })), [dispatch])
  const loadResults = useCallback((id) => dispatch(fetchEventResults(id)), [dispatch])
  const saveResults = useCallback((id, items) => dispatch(upsertEventResults({ id, items })), [dispatch])
  const loadMedia = useCallback((id) => dispatch(fetchEventMedia(id)), [dispatch])
  const loadTimeline = useCallback((id) => dispatch(fetchEventTimeline(id)), [dispatch])

  const loadParentEvents = useCallback((params) => dispatch(fetchParentEvents(params)), [dispatch])
  const loadParentUpcoming = useCallback((params) => dispatch(fetchParentUpcomingEvents(params)), [dispatch])
  const loadParentEvent = useCallback((id) => dispatch(fetchParentEventDetail(id)), [dispatch])
  const doFamilyRegister = useCallback((eventId, registrations) => dispatch(submitFamilyRegister({ eventId, registrations })), [dispatch])
  const doRsvp = useCallback((eventId, studentId, rsvpStatus) => dispatch(submitRsvp({ eventId, studentId, rsvpStatus })), [dispatch])

  const resetCurrentEvent = useCallback(() => dispatch(clearCurrentEvent()), [dispatch])
  const resetFamilyRegister = useCallback(() => dispatch(clearFamilyRegisterResult()), [dispatch])

  return {
    ...events,
    loadEvents,
    loadEvent,
    saveCreateEvent,
    saveUpdateEvent,
    removeEvent,
    doPublish,
    doCancel,
    doComplete,
    loadRegistrations,
    addRegistrations,
    loadResults,
    saveResults,
    loadMedia,
    loadTimeline,
    loadParentEvents,
    loadParentUpcoming,
    loadParentEvent,
    doFamilyRegister,
    doRsvp,
    resetCurrentEvent,
    resetFamilyRegister,
  }
}
