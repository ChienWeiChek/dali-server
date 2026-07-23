import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Heavy energy queries (monthly, 365 d) can take 30–60 s.
      // Give them a generous window before TanStack considers the request stale.
      staleTime: 5 * 60 * 1000,       // 5 min — don't re-fetch on every mount
      gcTime:    10 * 60 * 1000,       // 10 min — keep cache across page nav
      retry: 1,                        // one automatic retry; not three (default)
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
