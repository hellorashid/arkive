import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BasicProvider } from '@basictech/react';
import App from './App.tsx';
import { basicConfig } from './basic.config.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicProvider clientId={basicConfig.clientId} schema={basicConfig}>
      <App />
    </BasicProvider>
  </StrictMode>
);
