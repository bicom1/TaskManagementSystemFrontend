import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      retryDelay: 800,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          richColors
          position="top-right"
          closeButton
          duration={4500}
          toastOptions={{
            classNames: {
              toast:
                'group border border-hairline bg-paper text-ink shadow-lg rounded-xl px-4 py-3 gap-3',
              title: 'text-sm font-semibold tracking-tight',
              description: 'text-xs text-graphite',
              actionButton: 'bg-brand-600 text-white',
              cancelButton: 'bg-cloud text-ink',
              closeButton: 'border-hairline bg-paper text-graphite',
              success: 'border-emerald-200',
              error: 'border-red-200',
              warning: 'border-amber-200',
              info: 'border-sky-200',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
