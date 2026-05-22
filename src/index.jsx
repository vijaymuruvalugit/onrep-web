import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import store from './store'
import { restorePublicHashRoute } from './utils/restorePublicHashRoute'

// Must run before React Router mounts — HashRouter ignores document pathname.
if (restorePublicHashRoute()) {
  // Navigation in progress; skip first paint (login flash).
} else {
  createRoot(document.getElementById('root')).render(
    <Provider store={store}>
      <App />
    </Provider>,
  )
}
