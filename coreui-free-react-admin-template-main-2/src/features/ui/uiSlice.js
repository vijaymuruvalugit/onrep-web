import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarShow: true,
  sidebarUnfoldable: false,
  theme: 'light',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarShow(state, action) {
      state.sidebarShow = Boolean(action.payload)
    },
    setSidebarUnfoldable(state, action) {
      state.sidebarUnfoldable = Boolean(action.payload)
    },
    setTheme(state, action) {
      state.theme = action.payload || 'light'
    },
  },
})

export const { setSidebarShow, setSidebarUnfoldable, setTheme } = uiSlice.actions
export default uiSlice.reducer
