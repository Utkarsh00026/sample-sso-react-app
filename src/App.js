/* global chrome */
import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { useIsAuthenticated } from '@azure/msal-react';


function App() {
  
  const [input,setInput] = useState();

  // Set the redirect URI to the chromiumapp.com provided by Chromium
const redirectUri = typeof chrome !== "undefined" && chrome.identity ?
chrome.identity.getRedirectURL() : 
`${window.location.origin}/index.html`;

console.log("Chrome extension redirect URI set to ", redirectUri);
console.log("This url must be registered in the Azure portal as a single-page application redirect uri, and as the post logout url");

const msalInstance = new PublicClientApplication({
auth: {
    authority: "https://login.microsoftonline.com/common/",
    clientId: "30130225-1e9b-4502-9d9f-767b2d902f76",
    redirectUri,
    postLogoutRedirectUri: redirectUri
},
cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
}
});

/**
 * Launch the Chromium web auth UI.
 * @param {*} url AAD url to navigate to.
 * @param {*} interactive Whether or not the flow is interactive
 */
async function launchWebAuthFlow(url) {
  return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
          interactive: true,
          url
      }, (responseUrl) => {
          // Response urls includes a hash (login, acquire token calls)
          if (responseUrl.includes("#")) {
              msalInstance.handleRedirectPromise(`#${responseUrl.split("#")[1]}`)
                  .then(resolve)
                  .catch(reject)
          } else {
              // Logout calls
              resolve();
          }
      })
  })
}
async function acquireToken(request) {
  return msalInstance.acquireTokenSilent(request)
      .catch(async (error) => {
          console.error(error);
          const acquireTokenUrl = await getAcquireTokenUrl(request);
          return launchWebAuthFlow(acquireTokenUrl);
      })
}
async function getAcquireTokenUrl(request) {
  return new Promise((resolve, reject) => {
      msalInstance.acquireTokenRedirect({
          ...request,
          onRedirectNavigate: (url) => {
              resolve(url);
              return false;
          }
      }).catch(reject);
  });
}
async function callGraphMeEndpoint() {
  const response = await acquireToken({
      scopes: [ "user.read" ],
      account: msalInstance.getAllAccounts()[0]
  });
  console.log("########### \n This is access token details ~> \n ##########\n",response)

  return callMSGraph("https://graph.microsoft.com/v1.0/me", response.accessToken);
}
async function callMSGraph(endpoint, accessToken) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append("Authorization", bearer);

  const options = {
      method: "GET",
      headers
  };

  return fetch(endpoint, options)
      .then(response => response.json())
      .catch(error => console.log(error));
}
 
useEffect(() => {
  async function handleSSO(){
    const graphResult = await callGraphMeEndpoint();
    setInput(graphResult.displayName)
    
  }
  handleSSO()
},[])
async function getLogoutUrl(request) {
  return new Promise((resolve, reject) => {
      msalInstance.logout({
          ...request,
          onRedirectNavigate: (url) => {
              resolve(url);
              return false;
          }
      }).catch(reject);
  });
}
async function handleLogout(){
  const logoutUrl = await getLogoutUrl();

  await launchWebAuthFlow(logoutUrl);
}
  return (
    <div className='App'>

    <p>{input}</p>
    <button onClick={handleLogout}>Logout</button>
   
    </div>
   
  );
}

export default App;
