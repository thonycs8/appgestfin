import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from '@/contexts/AppContext';
import App from './App';
import './index.css';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key. Please check your .env file and make sure you have set VITE_CLERK_PUBLISHABLE_KEY.");
  console.error("You can get your key from: https://dashboard.clerk.com/last-active?path=api-keys");
}

// Provide a fallback to prevent the app from crashing during development
const fallbackKey = PUBLISHABLE_KEY || 'pk_test_placeholder';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={fallbackKey}>
      <BrowserRouter>
        <AppProvider>
          <App />
          <Toaster />
        </AppProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);