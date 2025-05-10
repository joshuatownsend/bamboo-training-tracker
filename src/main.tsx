
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import MsalContextProvider from './contexts/MsalContext.tsx'

// Load the Entra ID auth configuration
import './lib/authConfig.ts'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <MsalContextProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* Add React Query Devtools in non-production environments */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </MsalContextProvider>
  </BrowserRouter>
);
