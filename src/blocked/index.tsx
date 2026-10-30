import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockedApp } from './BlockedApp';
import '../styles/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BlockedApp />
    </React.StrictMode>
  );
}
