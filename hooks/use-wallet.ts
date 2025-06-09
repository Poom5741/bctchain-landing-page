"use client";

import { useState, useEffect, useCallback } from "react";
import { DEX_CONFIG } from "@/lib/token-list";

// Wallet connection states
export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  isCorrectNetwork: boolean;
  networkName: string | null;
}

// Supported wallets
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed?: boolean;
}

// Ethereum provider type
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const SUPPORTED_WALLETS: WalletProvider[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect using browser wallet",
    installed:
      typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "📱",
    description: "Connect with mobile wallet",
    installed: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "🔷",
    description: "Connect using Coinbase",
    installed:
      typeof window !== "undefined" &&
      !!(window as any).ethereum?.isCoinbaseWallet,
  },
];

// BCTChain network configuration
export const BCT_CHAIN = {
  id: DEX_CONFIG.CHAIN_ID, // 1190
  name: DEX_CONFIG.CHAIN_NAME,
  symbol: "BCT",
  rpcUrl: DEX_CONFIG.RPC_URL,
  explorer: DEX_CONFIG.EXPLORER_URL,
  decimals: 18,
};

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
    isCorrectNetwork: false,
    networkName: null,
  });

  // Get Ethereum provider
  const getProvider = useCallback(() => {
    if (typeof window === "undefined") return null;
    return window.ethereum;
  }, []);

  // Check if wallet is installed
  const isWalletInstalled = useCallback(
    (walletId: string) => {
      const provider = getProvider();
      if (!provider) return false;

      switch (walletId) {
        case "metamask":
          return !!provider.isMetaMask;
        case "coinbase":
          return !!provider.isCoinbaseWallet;
        default:
          return !!provider;
      }
    },
    [getProvider]
  );

  // Connect to wallet
  const connect = useCallback(
    async (walletId: string) => {
      const provider = getProvider();

      if (!provider) {
        setConnection((prev) => ({
          ...prev,
          error:
            "No wallet found. Please install MetaMask or another compatible wallet.",
        }));
        return;
      }

      if (!isWalletInstalled(walletId)) {
        setConnection((prev) => ({
          ...prev,
          error: `${walletId} wallet not found. Please install ${walletId}.`,
        }));
        return;
      }

      setConnection((prev) => ({ ...prev, isConnecting: true, error: null }));

      try {
        // Request account access
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found. Please connect your wallet.");
        }

        const address = accounts[0];

        // Get chain ID
        const chainId = await provider.request({
          method: "eth_chainId",
        });

        const numericChainId = parseInt(chainId, 16);

        // Get balance
        const balanceHex = await provider.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });

        const balanceWei = parseInt(balanceHex, 16);
        const balanceEth = balanceWei / Math.pow(10, 18);

        // Get network name for display
        const isCorrectNetwork = numericChainId === BCT_CHAIN.id;
        let networkName = null;
        if (isCorrectNetwork) {
          networkName = BCT_CHAIN.name;
        } else {
          // Try to get network name from known networks
          const knownNetworks: { [key: number]: string } = {
            1: "Ethereum Mainnet",
            3: "Ropsten",
            4: "Rinkeby",
            5: "Goerli",
            42: "Kovan",
            56: "BSC Mainnet",
            97: "BSC Testnet",
            137: "Polygon Mainnet",
            80001: "Polygon Mumbai",
            1190: "BCTChain",
          };
          networkName =
            knownNetworks[numericChainId] || `Chain ${numericChainId}`;
        }

        console.log(
          `Connected: Chain ${numericChainId} (${networkName}), isCorrect: ${isCorrectNetwork}`
        );

        setConnection({
          isConnected: true,
          address,
          balance: balanceEth.toFixed(4),
          chainId: numericChainId,
          isConnecting: false,
          error: null,
          isCorrectNetwork,
          networkName,
        });

        // Store connection in localStorage for persistence
        localStorage.setItem(
          "bct_wallet_connection",
          JSON.stringify({
            walletId,
            address,
            chainId: numericChainId,
            timestamp: Date.now(),
          })
        );

        // Set up event listeners
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
        provider.on("disconnect", handleDisconnect);
      } catch (error: any) {
        let errorMessage = "Failed to connect wallet";

        if (error.code === 4001) {
          errorMessage = "Connection rejected by user";
        } else if (error.code === -32002) {
          errorMessage = "Wallet connection request already pending";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setConnection((prev) => ({
          ...prev,
          isConnecting: false,
          error: errorMessage,
        }));
      }
    },
    [getProvider, isWalletInstalled]
  );

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setConnection((prev) => ({
        ...prev,
        address: accounts[0],
      }));
      // Update balance for new account
      updateBalance(accounts[0]);
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    const numericChainId = parseInt(chainId, 16);
    const isCorrectNetwork = numericChainId === BCT_CHAIN.id;

    // Get network name for display
    let networkName = null;
    if (isCorrectNetwork) {
      networkName = BCT_CHAIN.name;
    } else {
      // Try to get network name from known networks
      const knownNetworks: { [key: number]: string } = {
        1: "Ethereum Mainnet",
        3: "Ropsten",
        4: "Rinkeby",
        5: "Goerli",
        42: "Kovan",
        56: "BSC Mainnet",
        97: "BSC Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai",
        1190: "BCTChain",
      };
      networkName = knownNetworks[numericChainId] || `Chain ${numericChainId}`;
    }

    console.log(
      `Network changed: ${numericChainId} (${networkName}), isCorrect: ${isCorrectNetwork}`
    );

    setConnection((prev) => ({
      ...prev,
      chainId: numericChainId,
      isCorrectNetwork,
      networkName,
    }));
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, []);

  // Update balance
  const updateBalance = useCallback(
    async (address: string) => {
      const provider = getProvider();
      if (!provider) return;

      try {
        const balanceHex = await provider.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });

        const balanceWei = parseInt(balanceHex, 16);
        const balanceEth = balanceWei / Math.pow(10, 18);

        setConnection((prev) => ({
          ...prev,
          balance: balanceEth.toFixed(4),
        }));
      } catch (error) {
        console.error("Failed to update balance:", error);
      }
    },
    [getProvider]
  );

  // Disconnect wallet
  const disconnect = useCallback(() => {
    const provider = getProvider();

    if (provider) {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
      provider.removeListener("disconnect", handleDisconnect);
    }

    setConnection({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      error: null,
      isCorrectNetwork: false,
      networkName: null,
    });

    localStorage.removeItem("bct_wallet_connection");
  }, [
    getProvider,
    handleAccountsChanged,
    handleChainChanged,
    handleDisconnect,
  ]);

  // Switch to BCTChain network
  const switchToBCTChain = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !connection.isConnected) {
      setConnection((prev) => ({
        ...prev,
        error: "Please connect your wallet first",
      }));
      return;
    }

    try {
      setConnection((prev) => ({ ...prev, error: null }));

      console.log(`Attempting to switch to BCTChain (${BCT_CHAIN.id})`);

      // Try to switch to BCTChain
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${BCT_CHAIN.id.toString(16)}` }],
      });

      console.log("Network switch request successful");
    } catch (error: any) {
      console.error("Network switch error:", error);

      // If the chain hasn't been added to MetaMask, add it
      if (error.code === 4902) {
        try {
          console.log("Adding BCTChain network...");
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${BCT_CHAIN.id.toString(16)}`,
                chainName: BCT_CHAIN.name,
                nativeCurrency: {
                  name: BCT_CHAIN.symbol,
                  symbol: BCT_CHAIN.symbol,
                  decimals: BCT_CHAIN.decimals,
                },
                rpcUrls: [BCT_CHAIN.rpcUrl],
                blockExplorerUrls: [BCT_CHAIN.explorer],
              },
            ],
          });
          console.log("Network added successfully");
        } catch (addError: any) {
          console.error("Failed to add network:", addError);
          setConnection((prev) => ({
            ...prev,
            error: "Failed to add BCTChain network to wallet",
          }));
        }
      } else if (error.code === 4001) {
        // User rejected the request
        setConnection((prev) => ({
          ...prev,
          error: "Network switch was rejected by user",
        }));
      } else {
        setConnection((prev) => ({
          ...prev,
          error: "Failed to switch to BCTChain network",
        }));
      }
    }
  }, [getProvider, connection.isConnected]);

  // Auto-reconnect on page load
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;

    const stored = localStorage.getItem("bct_wallet_connection");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if connection is not too old (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          // Try to reconnect silently
          provider
            .request({ method: "eth_accounts" })
            .then(async (accounts: string[]) => {
              if (
                accounts &&
                accounts.length > 0 &&
                accounts[0] === data.address
              ) {
                // Get current chain ID to ensure accuracy
                const currentChainIdHex = await provider.request({
                  method: "eth_chainId",
                });
                const currentChainId = parseInt(currentChainIdHex, 16);

                // Get network name for display
                const isCorrectNetwork = currentChainId === BCT_CHAIN.id;
                let networkName = null;
                if (isCorrectNetwork) {
                  networkName = BCT_CHAIN.name;
                } else {
                  const knownNetworks: { [key: number]: string } = {
                    1: "Ethereum Mainnet",
                    3: "Ropsten",
                    4: "Rinkeby",
                    5: "Goerli",
                    42: "Kovan",
                    56: "BSC Mainnet",
                    97: "BSC Testnet",
                    137: "Polygon Mainnet",
                    80001: "Polygon Mumbai",
                    1190: "BCTChain",
                  };
                  networkName =
                    knownNetworks[currentChainId] || `Chain ${currentChainId}`;
                }

                console.log(
                  `Auto-reconnect: Chain ${currentChainId} (${networkName}), isCorrect: ${isCorrectNetwork}`
                );

                setConnection({
                  isConnected: true,
                  address: data.address,
                  balance: null,
                  chainId: currentChainId,
                  isConnecting: false,
                  error: null,
                  isCorrectNetwork,
                  networkName,
                });
                // Update balance
                updateBalance(data.address);

                // Set up event listeners
                provider.on("accountsChanged", handleAccountsChanged);
                provider.on("chainChanged", handleChainChanged);
                provider.on("disconnect", handleDisconnect);
              }
            })
            .catch(() => {
              localStorage.removeItem("bct_wallet_connection");
            });
        } else {
          localStorage.removeItem("bct_wallet_connection");
        }
      } catch (error) {
        localStorage.removeItem("bct_wallet_connection");
      }
    }
  }, [
    getProvider,
    updateBalance,
    handleAccountsChanged,
    handleChainChanged,
    handleDisconnect,
  ]);

  const formatAddress = useCallback((address: string | null) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const formatBalance = useCallback((balance: string | null) => {
    if (!balance) return "0.0000";
    return parseFloat(balance).toFixed(4);
  }, []);

  return {
    connection,
    connect,
    disconnect,
    switchToBCTChain,
    formatAddress,
    formatBalance,
    supportedWallets: SUPPORTED_WALLETS,
    bctChain: BCT_CHAIN,
    isWalletInstalled,
  };
}
