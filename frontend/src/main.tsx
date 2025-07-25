import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
// import App from './SimpleApp.tsx'
// import { OfflineProvider } from './contexts/OfflineContext' // Removed offline features
import i18n from './i18n/i18n.ts'
import './index.css'
import 'leaflet/dist/leaflet.css'

console.log('Main.tsx loaded');

// Clear language preference from localStorage to ensure Khmer is always used
localStorage.removeItem('i18nextLng');

// Unregister any existing service workers to completely remove offline features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().then(function(success) {
          console.log('Service Worker unregistered:', success);
        });
      }
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Add staleTime to reduce network requests when offline
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Add cacheTime to keep data in cache longer
      cacheTime: 60 * 60 * 1000, // 1 hour
    },
  },
})

// Wait for i18n to be ready before rendering
i18n.on('initialized', () => {
  console.log('i18n initialized with language:', i18n.language);
  console.log('i18n resources:', i18n.options.resources);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)