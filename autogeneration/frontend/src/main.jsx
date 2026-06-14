// index.js или main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';  // ← импорт глобальных стилей
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);