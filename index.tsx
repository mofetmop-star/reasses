
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("[v0] index.tsx loaded, looking for root element");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[v0] Could not find root element!");
  throw new Error("Could not find root element to mount to");
}

console.log("[v0] Root element found, creating React root");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("[v0] React render called");
