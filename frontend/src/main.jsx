/**
 * @file src/main.jsx
 * @description Application entry point. Bootstraps React, configures the TanStack QueryClient
 * for API caching, and wraps the application in the React Router BrowserRouter.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeProvider';

// Initialize QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents excessive API calls when switching browser tabs
      retry: 1, // Only retry failed requests once
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes before considering it stale
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light">
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);