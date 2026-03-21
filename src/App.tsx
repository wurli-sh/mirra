import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { config } from '@/config/wagmi'
import { MainLayout } from '@/components/layout/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { TradePage } from '@/pages/TradePage'
import { ChatPage } from '@/pages/ChatPage'
import { useSessionCleanup } from '@/hooks/useSessionCleanup'

function SessionCleanup() {
  useSessionCleanup()
  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 2,
    },
  },
})

export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <SessionCleanup />
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(26, 26, 26, 0.85)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: '#FAFAFA',
                border: '1px solid rgba(255, 213, 240, 0.15)',
                borderRadius: '14px',
                fontFamily: 'Onest, sans-serif',
                fontSize: '13px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              },
              classNames: {
                actionButton: '!bg-[#FFD5F0] !text-[#1A1A1A] !font-semibold !rounded-md !text-xs',
              },
            }}
          />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/trade" element={<TradePage />} />
              <Route path="/leaderboard" element={<TradePage />} />
              <Route path="/oni" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
