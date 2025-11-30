import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Global error handling for ResizeObserver
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed')) {
    // Suppress ResizeObserver loop errors
    return;
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);
