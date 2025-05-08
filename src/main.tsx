
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Load the Entra ID auth configuration
import './lib/authConfig.ts'

createRoot(document.getElementById("root")!).render(<App />);
