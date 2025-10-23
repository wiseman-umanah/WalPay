import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FlowProvider } from "@onflow/react-sdk"
import { BrowserRouter } from 'react-router-dom'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
	<FlowProvider
		config={{
			accessNodeUrl: "https://access-testnet.onflow.org",
			flowNetwork: "testnet",
			discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
			discoveryWalletMethod: "IFRAME/RPC",
			discoveryAuthnEndpoint: "https://fcl-discovery.onflow.org/api/authn",
			discoveryAuthnInclude: ["0x9d2e44203cb13051", "0xe5cd26afebe62781"],
			appDetailTitle: "WalletPay",
			appDetailIcon: "https://example.com/icon.png",
			appDetailDescription: "A decentralized app on Flow",
			appDetailUrl: "http://localhost:5173",
			walletconnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

		}}
		colorMode='light'
	>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</FlowProvider>
  </StrictMode>,
)
