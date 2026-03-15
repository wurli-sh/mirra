import { http, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { somniaTestnet } from './chains'

export const config = createConfig({
  chains: [somniaTestnet],
  connectors: [injected()],
  transports: {
    [somniaTestnet.id]: http(),
  },
})
