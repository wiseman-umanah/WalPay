import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FlowProvider } from "@onflow/react-sdk"
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import "./flow/setup"
import { HelmetProvider } from "react-helmet-async"


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <FlowProvider
        config={{
          accessNodeUrl: "https://access-testnet.onflow.org",
          flowNetwork: "testnet",
          discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
          discoveryWalletMethod: "IFRAME/RPC",
          discoveryAuthnEndpoint: "https://fcl-discovery.onflow.org/api/authn",
          discoveryAuthnInclude: ["0x7bcb95a415452d7d"],
          appDetailTitle: "WalletPay",
          appDetailIcon: "https://example.com/icon.png",
          appDetailDescription: "A decentralized app on Flow",
          appDetailUrl: import.meta.env.VITE_APP_URL ?? window.location.origin,
          walletconnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
        }}
        colorMode='dark'
      >
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </FlowProvider>
    </HelmetProvider>
  </StrictMode>,
)
