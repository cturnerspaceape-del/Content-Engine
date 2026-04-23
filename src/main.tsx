import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// StrictMode intentionally NOT used: it double-fires every useEffect in dev,
// which is a cost footgun for any effect that makes a billable API call.
createRoot(document.getElementById('root')!).render(<App />)
