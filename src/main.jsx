import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId || clientId === 'dummy-client-id' || clientId === '' || !clientId.includes('.apps.googleusercontent.com')) {
  document.getElementById('root').innerHTML = `
    <div style="font-family: system-ui, sans-serif; padding: 2rem; color: #b91c1c; background: #fef2f2; min-height: 100vh;">
      <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Configuration Error</h1>
      <p>Google OAuth Client ID is not configured.</p>
      <p style="margin-top: 1rem; font-size: 0.875rem; color: #7f1d1d;">Please ensure VITE_GOOGLE_CLIENT_ID is set in your .env.local file and restart Vite.</p>
    </div>
  `;
  throw new Error("Google OAuth Client ID is not configured.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
