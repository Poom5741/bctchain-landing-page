import { useState, useEffect } from "react";

export interface Transaction {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
  hash?: string;
  gasUsed?: string;
  gasPrice?: string;
  priceImpact?: number;
  fee?: string;
}

const STORAGE_KEY = "bct-dex-transactions";
const MAX_TRANSACTIONS = 100;

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Failed to load transaction history:", error);
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transaction history:", error);
    }
  }, [transactions]);

  const addTransaction = (
    transaction: Omit<Transaction, "id" | "timestamp">
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
    };

    setTransactions((prev) => {
      const updated = [newTransaction, ...prev];
      // Keep only the most recent transactions
      return updated.slice(0, MAX_TRANSACTIONS);
    });

    return newTransaction.id;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const clearHistory = () => {
    setTransactions([]);
  };

  const getTransactionsByStatus = (status: Transaction["status"]) => {
    return transactions.filter((tx) => tx.status === status);
  };

  const getRecentTransactions = (limit: number = 10) => {
    return transactions.slice(0, limit);
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    clearHistory,
    getTransactionsByStatus,
    getRecentTransactions,
  };
}

// Utility functions for transaction management
export function generateMockTransactions(): Transaction[] {
  const tokens = ["sBTC", "sETH", "sUSD", "sGOLD", "sOIL", "sSPX"];
  const statuses: Transaction["status"][] = [
    "completed",
    "completed",
    "completed",
    "pending",
    "failed",
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const fromToken = tokens[Math.floor(Math.random() * tokens.length)];
    let toToken = tokens[Math.floor(Math.random() * tokens.length)];
    while (toToken === fromToken) {
      toToken = tokens[Math.floor(Math.random() * tokens.length)];
    }

    const fromAmount = (Math.random() * 10).toFixed(4);
    const toAmount = (
      parseFloat(fromAmount) *
      (0.5 + Math.random() * 2)
    ).toFixed(4);
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: (Date.now() - i * 3600000).toString(),
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      status,
      timestamp: Date.now() - i * 3600000 - Math.random() * 3600000,
      hash:
        status !== "pending"
          ? `0x${Math.random().toString(16).substr(2, 64)}`
          : undefined,
      gasUsed:
        status === "completed"
          ? (150000 + Math.random() * 50000).toFixed(0)
          : undefined,
      gasPrice: (20 + Math.random() * 30).toFixed(1),
      priceImpact: Math.random() * 2,
      fee: (parseFloat(fromAmount) * 0.001).toFixed(6),
    };
  });
}

export function formatTransactionTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return `${seconds}s ago`;
  }
}

export function getTransactionStatusColor(
  status: Transaction["status"]
): string {
  switch (status) {
    case "completed":
      return "text-green-400";
    case "pending":
      return "text-yellow-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getTransactionStatusIcon(
  status: Transaction["status"]
): string {
  switch (status) {
    case "completed":
      return "✓";
    case "pending":
      return "⏳";
    case "failed":
      return "✗";
    default:
      return "?";
  }
}
