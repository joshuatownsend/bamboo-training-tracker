
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MsalProvider } from './contexts/MsalContext.tsx'

// Load the Entra ID auth configuration
import './lib/authConfig.ts'

createRoot(document.getElementById("root")!).render(
  <MsalProvider>
    <App />
  </MsalProvider>
);
