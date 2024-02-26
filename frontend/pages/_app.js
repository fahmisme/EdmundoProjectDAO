import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import "@rainbow-me/rainbowkit/styles.css";
import "@/styles/globals.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";


const chains = [sepolia]
const { connectors } = getDefaultWallets({
  appName: "edmundoProject",
  projectId: "8248269e878e72947e5ede5ad32ca762",
  
});

import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'


const config = createConfig({
  chains : chains,
  transports: {
    [sepolia.id]: http(),
  },
  connectors,
})

// const { chains, publicClient } = http([sepolia], [publicProvider]);
//https://wagmi.sh/react/guides/migrate-from-v1-to-v2#removed-configurechains


export default function App({ Component, pageProps }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
          },
        },
      }),
  );
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>

    </WagmiProvider>
  )
}
