import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { Toaster } from 'react-hot-toast';

// Ethers.js is a library for interacting with Ethereum blockchains. It's not included in the prompt,
// but it's essential for this app to function. It's imported as a module where needed.
// In a real project, you would `npm install ethers`.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: 'font-sans',
        style: {
          background: '#333',
          color: '#fff',
        },
      }}
    />
  </React.StrictMode>
);