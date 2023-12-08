/* global chrome */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Access from './'
import reportWebVitals from './reportWebVitals';
import { createMemoryRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';

const redirectUri = typeof chrome !== "undefined" && chrome.identity ?
chrome.identity.getRedirectURL() : 
`${window.location.origin}/index.html`;

const msalInstance = new PublicClientApplication({
  auth: {
      authority: "https://login.microsoftonline.com/common/",
      clientId: "f05c3678-71c2-456c-a9b4-a275db81972b",
      redirectUri,
      postLogoutRedirectUri: redirectUri
  },
  cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
  }
  });
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  <MsalProvider instance={msalInstance}>
    <App />
    </MsalProvider>
  </React.StrictMode>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
