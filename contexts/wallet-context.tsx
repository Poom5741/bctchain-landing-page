"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet, WalletConnection } from "@/hooks/use-wallet";

interface WalletContextType {
  connection: WalletConnection;
  connect: (walletId: string) => Promise<void>;
  disconnect: () => void;
  switchToBCTChain: () => Promise<void>;
  formatAddress: (address: string | null) => string;
  formatBalance: (balance: string | null) => string;
  isWalletInstalled: (walletId: string) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}
