import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BasicProvider, BasicUIProvider } from '@basictech/react';
import '@basictech/react/styles.css';
import App from './App.tsx';
import { basicConfig } from './basic.config.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicProvider clientId={basicConfig.clientId} schema={basicConfig}>
      <BasicUIProvider appearance={{
        theme: 'dark',
        base: '#1A1A1A',
        accent: '#B9906B',
        radius: '0.375rem'
      }}>
        <App />
      </BasicUIProvider>
    </BasicProvider>
  </StrictMode>
);
