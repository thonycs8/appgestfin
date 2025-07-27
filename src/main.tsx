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

// Check if the key is valid (starts with pk_test_ or pk_live_)
const isValidClerkKey = PUBLISHABLE_KEY && 
  (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_')) &&
  PUBLISHABLE_KEY.length > 20; // Ensure it's not just the prefix

console.log('🔑 Clerk key validation:', { 
  hasKey: !!PUBLISHABLE_KEY, 
  isValid: isValidClerkKey,
  keyPrefix: PUBLISHABLE_KEY?.substring(0, 15) + '...',
  keyLength: PUBLISHABLE_KEY?.length
});

// Error component for missing or invalid Clerk key
const ClerkConfigError = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Configuração Necessária
      </h1>
      <p className="text-gray-600 mb-4">
        A chave do Clerk não foi encontrada ou é inválida. Para continuar, você precisa:
      </p>
      <div className="text-left space-y-2 mb-6">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 font-semibold">1.</span>
          <span className="text-sm text-gray-700">
            Acesse o <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dashboard do Clerk</a>
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 font-semibold">2.</span>
          <span className="text-sm text-gray-700">
            Vá em "API Keys" e copie sua Publishable Key
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 font-semibold">3.</span>
          <span className="text-sm text-gray-700">
            Crie um arquivo <code className="bg-gray-100 px-1 rounded">.env</code> na raiz do projeto
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 font-semibold">4.</span>
          <span className="text-sm text-gray-700">
            Adicione: <code className="bg-gray-100 px-1 rounded text-xs">VITE_CLERK_PUBLISHABLE_KEY=sua_chave_aqui</code>
          </span>
        </div>
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 font-semibold">5.</span>
          <span className="text-sm text-gray-700">
            Configure os domínios no Clerk: <code className="bg-gray-100 px-1 rounded text-xs">http://localhost:5173</code>
          </span>
        </div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          <strong>Importante:</strong> A chave deve começar com <code>pk_test_</code> ou <code>pk_live_</code>. O template JWT "supabase" é opcional.
        </p>
      </div>
    </div>
  </div>
);

// Only render the app if we have a valid Clerk key
if (!isValidClerkKey) {
  console.error("❌ Missing or invalid Clerk Publishable Key.");
  console.error("Please check your .env file and make sure you have set VITE_CLERK_PUBLISHABLE_KEY.");
  console.error("You can get your key from: https://dashboard.clerk.com/last-active?path=api-keys");
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkConfigError />
    </React.StrictMode>
  );
} else {
  console.log('✅ Clerk key is valid, initializing app...');
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        appearance={{
          baseTheme: undefined,
          variables: {
            colorPrimary: '#3b82f6',
          },
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            card: 'shadow-lg rounded-lg border border-gray-200',
            headerTitle: 'text-xl font-semibold text-gray-900',
            headerSubtitle: 'text-gray-600',
            socialButtonsIconButton: 'border border-gray-300 hover:bg-gray-50',
            formFieldLabel: 'text-gray-700 font-medium',
            formFieldInput: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md',
          }
        }}
      >
        {console.log('🚀 Clerk provider initialized, starting app...')}
        <BrowserRouter>
          <AppProvider>
            <App />
            <Toaster />
          </AppProvider>
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>
  );
}