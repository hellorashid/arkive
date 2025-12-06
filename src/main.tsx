import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BasicProvider } from '@basictech/react';
import App from './App.tsx';
import { basicConfig } from './basic.config.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BasicProvider project_id={basicConfig.project_id} schema={basicConfig}>
      <App />
    </BasicProvider>
  </StrictMode>
);
