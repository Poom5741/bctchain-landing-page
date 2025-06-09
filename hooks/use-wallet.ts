"use client";

import { useState, useEffect, useCallback } from "react";

// Mock wallet connection states
export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

// Mock supported wallets
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed?: boolean;
}

export const SUPPORTED_WALLETS: WalletProvider[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Connect using browser wallet",
    installed: typeof window !== "undefined" && !!(window as any).ethereum,
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
    installed: true,
  },
];

// Mock BCTChain network
export const BCT_CHAIN = {
  id: 1337, // Placeholder chain ID for BCTChain
  name: "BCTChain",
  symbol: "BCT",
  rpcUrl: "https://rpc.bctchain.com",
  explorer: "https://scan.bctchain.com",
};

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  // Mock connection to simulate wallet interaction
  const connect = useCallback(async (walletId: string) => {
    setConnection((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Simulate connection delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Mock successful connection (90% success rate)
      if (Math.random() > 0.1) {
        const mockAddress = `0x${Math.random()
          .toString(16)
          .substring(2, 42)
          .padStart(40, "0")}`;
        const mockBalance = (Math.random() * 100 + 10).toFixed(4);

        setConnection({
          isConnected: true,
          address: mockAddress,
          balance: mockBalance,
          chainId: BCT_CHAIN.id,
          isConnecting: false,
          error: null,
        });

        // Store connection in localStorage for persistence
        localStorage.setItem(
          "bct_wallet_connection",
          JSON.stringify({
            walletId,
            address: mockAddress,
            balance: mockBalance,
            timestamp: Date.now(),
          })
        );
      } else {
        throw new Error("Connection failed. Please try again.");
      }
    } catch (error) {
      setConnection((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          error instanceof Error ? error.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnection({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
    localStorage.removeItem("bct_wallet_connection");
  }, []);

  const switchToBC = useCallback(async () => {
    if (!connection.isConnected) return;

    try {
      // Simulate network switch
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setConnection((prev) => ({ ...prev, chainId: BCT_CHAIN.id }));
    } catch (error) {
      setConnection((prev) => ({
        ...prev,
        error: "Failed to switch to BCTChain",
      }));
    }
  }, [connection.isConnected]);

  // Auto-reconnect on page load
  useEffect(() => {
    const stored = localStorage.getItem("bct_wallet_connection");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if connection is not too old (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          setConnection({
            isConnected: true,
            address: data.address,
            balance: data.balance,
            chainId: BCT_CHAIN.id,
            isConnecting: false,
            error: null,
          });
        } else {
          localStorage.removeItem("bct_wallet_connection");
        }
      } catch (error) {
        localStorage.removeItem("bct_wallet_connection");
      }
    }
  }, []);

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
    switchToBC,
    formatAddress,
    formatBalance,
    supportedWallets: SUPPORTED_WALLETS,
    bctChain: BCT_CHAIN,
  };
}
