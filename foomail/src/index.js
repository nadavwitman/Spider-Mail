import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext'; 
import 'bootstrap-icons/font/bootstrap-icons.css';
import { MailSchedulerProvider } from './context/MailSchedulerContext.js';
import { ComposeProvider } from './context/ComposeContext.js';
import ComposeMailWrapper from './components/composeMail/ComposeMailWrapper';
import { ThemeProvider } from './context/ThemeContext.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ComposeProvider>
        <AuthProvider>
          <MailSchedulerProvider>
            <App />
            <ComposeMailWrapper />
          </MailSchedulerProvider>
        </AuthProvider>
      </ComposeProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
