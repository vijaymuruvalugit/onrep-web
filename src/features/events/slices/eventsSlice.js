import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import normalizeApiError from '../../../api/normalizeApiError'
import eventsApi from '../api/eventsApi'

// ── Admin thunks ─────────────────────────────────────────────────────────────

export const fetchEventsList = createAsyncThunk(
  'events/fetchList',
  async (params = {}, thunkApi) => {
    try {
      return await eventsApi.listEvents(params)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchEventDetail = createAsyncThunk(
  'events/fetchDetail',
  async (id, thunkApi) => {
    try {
      return await eventsApi.getEvent(id)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const createEvent = createAsyncThunk(
  'events/create',
  async (payload, thunkApi) => {
    try {
      return await eventsApi.createEvent(payload)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, payload }, thunkApi) => {
    try {
      return await eventsApi.updateEvent(id, payload)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id, thunkApi) => {
    try {
      await eventsApi.deleteEvent(id)
      return id
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const publishEvent = createAsyncThunk(
  'events/publish',
  async ({ id, note }, thunkApi) => {
    try {
      return await eventsApi.publishEvent(id, { note })
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const cancelEvent = createAsyncThunk(
  'events/cancel',
  async ({ id, note }, thunkApi) => {
    try {
      return await eventsApi.cancelEvent(id, { note })
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const completeEvent = createAsyncThunk(
  'events/complete',
  async ({ id, note }, thunkApi) => {
    try {
      return await eventsApi.completeEvent(id, { note })
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchEventRegistrations = createAsyncThunk(
  'events/fetchRegistrations',
  async (id, thunkApi) => {
    try {
      const data = await eventsApi.listRegistrations(id)
      return { id, registrations: data.registrations || [] }
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const addEventRegistrations = createAsyncThunk(
  'events/addRegistrations',
  async ({ id, studentIds, status }, thunkApi) => {
    try {
      return await eventsApi.addRegistrations(id, studentIds, status)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchEventResults = createAsyncThunk(
  'events/fetchResults',
  async (id, thunkApi) => {
    try {
      const data = await eventsApi.getResults(id)
      return { id, results: data.results || [] }
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const upsertEventResults = createAsyncThunk(
  'events/upsertResults',
  async ({ id, items }, thunkApi) => {
    try {
      return await eventsApi.upsertResults(id, items)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchEventMedia = createAsyncThunk(
  'events/fetchMedia',
  async (id, thunkApi) => {
    try {
      const data = await eventsApi.getMedia(id)
      return { id, media: data.media || [] }
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchEventTimeline = createAsyncThunk(
  'events/fetchTimeline',
  async (id, thunkApi) => {
    try {
      const data = await eventsApi.getTimeline(id)
      return { id, timeline: data.timeline || [] }
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

// ── Parent thunks ─────────────────────────────────────────────────────────────

export const fetchParentEvents = createAsyncThunk(
  'events/fetchParentEvents',
  async (params = {}, thunkApi) => {
    try {
      const data = await eventsApi.getParentEvents(params)
      return data.events || []
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchParentUpcomingEvents = createAsyncThunk(
  'events/fetchParentUpcoming',
  async (params = {}, thunkApi) => {
    try {
      const data = await eventsApi.getParentUpcomingEvents(params)
      return data.events || []
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const fetchParentEventDetail = createAsyncThunk(
  'events/fetchParentDetail',
  async (id, thunkApi) => {
    try {
      return await eventsApi.getParentEvent(id)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const submitFamilyRegister = createAsyncThunk(
  'events/familyRegister',
  async ({ eventId, registrations }, thunkApi) => {
    try {
      return await eventsApi.familyRegister(eventId, registrations)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

export const submitRsvp = createAsyncThunk(
  'events/submitRsvp',
  async ({ eventId, studentId, rsvpStatus }, thunkApi) => {
    try {
      return await eventsApi.setRsvp(eventId, studentId, rsvpStatus)
    } catch (e) {
      return thunkApi.rejectWithValue(normalizeApiError(e))
    }
  },
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  // Admin list
  events: [],
  eventsTotal: 0,
  eventsLoading: false,
  eventsError: null,

  // Admin detail
  currentEvent: null,
  currentEventLoading: false,
  currentEventError: null,

  // Admin sub-resources keyed by event id
  registrationsMap: {},
  resultsMap: {},
  mediaMap: {},
  timelineMap: {},

  // Mutation state
  mutating: false,
  mutateError: null,

  // Parent list
  parentEvents: [],
  parentEventsLoading: false,
  parentEventsError: null,

  parentUpcomingEvents: [],
  parentUpcomingLoading: false,

  // Parent detail
  parentCurrentEvent: null,
  parentCurrentEventLoading: false,
  parentCurrentEventError: null,

  // Family register
  familyRegisterResult: null,
  familyRegisterLoading: false,
  familyRegisterError: null,
}

function applyEventUpdate(state, updated) {
  state.events = state.events.map((e) => (e.id === updated.id ? updated : e))
  if (state.currentEvent?.id === updated.id) state.currentEvent = updated
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent(state) {
      state.currentEvent = null
      state.currentEventError = null
    },
    clearMutateError(state) {
      state.mutateError = null
    },
    clearFamilyRegisterResult(state) {
      state.familyRegisterResult = null
      state.familyRegisterError = null
    },
  },
  extraReducers: (builder) => {
    // List
    builder
      .addCase(fetchEventsList.pending, (s) => { s.eventsLoading = true; s.eventsError = null })
      .addCase(fetchEventsList.fulfilled, (s, a) => {
        s.eventsLoading = false
        s.events = a.payload.events || []
        s.eventsTotal = a.payload.total || 0
      })
      .addCase(fetchEventsList.rejected, (s, a) => { s.eventsLoading = false; s.eventsError = a.payload })

    // Detail
    builder
      .addCase(fetchEventDetail.pending, (s) => { s.currentEventLoading = true; s.currentEventError = null })
      .addCase(fetchEventDetail.fulfilled, (s, a) => { s.currentEventLoading = false; s.currentEvent = a.payload })
      .addCase(fetchEventDetail.rejected, (s, a) => { s.currentEventLoading = false; s.currentEventError = a.payload })

    // Create / Update / Delete / Transitions
    const mutatingThunks = [createEvent, updateEvent, deleteEvent, publishEvent, cancelEvent, completeEvent, addEventRegistrations, upsertEventResults]
    for (const thunk of mutatingThunks) {
      builder
        .addCase(thunk.pending, (s) => { s.mutating = true; s.mutateError = null })
        .addCase(thunk.rejected, (s, a) => { s.mutating = false; s.mutateError = a.payload })
    }
    builder
      .addCase(createEvent.fulfilled, (s, a) => { s.mutating = false; s.events = [a.payload, ...s.events] })
      .addCase(updateEvent.fulfilled, (s, a) => { s.mutating = false; applyEventUpdate(s, a.payload) })
      .addCase(deleteEvent.fulfilled, (s, a) => { s.mutating = false; s.events = s.events.filter((e) => e.id !== a.payload) })
      .addCase(publishEvent.fulfilled, (s, a) => { s.mutating = false; applyEventUpdate(s, a.payload) })
      .addCase(cancelEvent.fulfilled, (s, a) => { s.mutating = false; applyEventUpdate(s, a.payload) })
      .addCase(completeEvent.fulfilled, (s, a) => { s.mutating = false; applyEventUpdate(s, a.payload) })
      .addCase(addEventRegistrations.fulfilled, (s) => { s.mutating = false })
      .addCase(upsertEventResults.fulfilled, (s) => { s.mutating = false })

    // Sub-resources
    builder
      .addCase(fetchEventRegistrations.fulfilled, (s, a) => {
        s.registrationsMap[a.payload.id] = a.payload.registrations
      })
      .addCase(fetchEventResults.fulfilled, (s, a) => {
        s.resultsMap[a.payload.id] = a.payload.results
      })
      .addCase(fetchEventMedia.fulfilled, (s, a) => {
        s.mediaMap[a.payload.id] = a.payload.media
      })
      .addCase(fetchEventTimeline.fulfilled, (s, a) => {
        s.timelineMap[a.payload.id] = a.payload.timeline
      })

    // Parent list
    builder
      .addCase(fetchParentEvents.pending, (s) => { s.parentEventsLoading = true; s.parentEventsError = null })
      .addCase(fetchParentEvents.fulfilled, (s, a) => { s.parentEventsLoading = false; s.parentEvents = a.payload })
      .addCase(fetchParentEvents.rejected, (s, a) => { s.parentEventsLoading = false; s.parentEventsError = a.payload })

    builder
      .addCase(fetchParentUpcomingEvents.pending, (s) => { s.parentUpcomingLoading = true })
      .addCase(fetchParentUpcomingEvents.fulfilled, (s, a) => { s.parentUpcomingLoading = false; s.parentUpcomingEvents = a.payload })
      .addCase(fetchParentUpcomingEvents.rejected, (s) => { s.parentUpcomingLoading = false })

    // Parent detail
    builder
      .addCase(fetchParentEventDetail.pending, (s) => { s.parentCurrentEventLoading = true; s.parentCurrentEventError = null })
      .addCase(fetchParentEventDetail.fulfilled, (s, a) => { s.parentCurrentEventLoading = false; s.parentCurrentEvent = a.payload })
      .addCase(fetchParentEventDetail.rejected, (s, a) => { s.parentCurrentEventLoading = false; s.parentCurrentEventError = a.payload })

    // Family register
    builder
      .addCase(submitFamilyRegister.pending, (s) => { s.familyRegisterLoading = true; s.familyRegisterError = null; s.familyRegisterResult = null })
      .addCase(submitFamilyRegister.fulfilled, (s, a) => { s.familyRegisterLoading = false; s.familyRegisterResult = a.payload })
      .addCase(submitFamilyRegister.rejected, (s, a) => { s.familyRegisterLoading = false; s.familyRegisterError = a.payload })
  },
})

export const { clearCurrentEvent, clearMutateError, clearFamilyRegisterResult } = eventsSlice.actions
export default eventsSlice.reducer
