// BCTChain API utilities - Optimized for static export
const API_BASE_URL = "https://scan.bctchain.com/api/v2";

export interface BlockchainStats {
  totalBlocks: number; // Changed from blockHeight to totalBlocks
  totalTransactions: number;
  totalAssets: number;
  networkHealth: string;
  blockTime: number;
  validators: number;
  tvl: string;
  volume24h: string;
  activeUsers: number;
  totalAddresses: number;
  marketCap: string;
  isConnected: boolean;
  gasUsedToday: string;
  transactionsToday: number;
  networkUtilization: number;
  gasPrices: {
    slow: number;
    average: number;
    fast: number;
  };
}

export interface Block {
  height: number;
  hash: string;
  timestamp: string;
  transactions: number;
  validator: string;
  gasUsed: string;
  gasLimit: string;
  size: number;
}

export interface Transaction {
  hash: string;
  block: number;
  timestamp: string;
  type: string;
  status: string;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  fee?: string;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  holdersCount: number;
  transfersCount: number;
  type: string;
}

// Fetch comprehensive blockchain statistics using the new v2/stats endpoint
export async function getBlockchainStats(): Promise<BlockchainStats> {
  try {
    const fetchWithTimeout = (url: string) =>
      fetch(url, {
        headers: {
          accept: "application/json",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);

    // Use the new comprehensive stats endpoint
    const [statsResponse, tokensResponse] = await Promise.all([
      fetchWithTimeout(`${API_BASE_URL}/stats`),
      fetchWithTimeout(`${API_BASE_URL}/tokens`),
    ]);

    let totalBlocks = 0;
    let totalTransactions = 0;
    let totalAddresses = 0;
    let blockTime = 2.0;
    let gasUsedToday = "0";
    let transactionsToday = 0;
    let networkUtilization = 0;
    let gasPrices = { slow: 0.01, average: 0.01, fast: 0.01 };
    let marketCap = "0";
    let isConnected = false;

    if (statsResponse?.ok) {
      try {
        const statsData = await statsResponse.json();

        // Extract data from the new comprehensive stats endpoint
        totalBlocks = parseInt(statsData.total_blocks) || 0;
        totalTransactions = parseInt(statsData.total_transactions) || 0;
        totalAddresses = parseInt(statsData.total_addresses) || 0;
        blockTime = statsData.average_block_time
          ? statsData.average_block_time / 1000
          : 2.0; // Convert ms to seconds
        gasUsedToday = statsData.gas_used_today || "0";
        transactionsToday = parseInt(statsData.transactions_today) || 0;
        networkUtilization = statsData.network_utilization_percentage || 0;
        marketCap = statsData.market_cap || "0";

        // Extract gas prices
        if (statsData.gas_prices) {
          gasPrices = {
            slow: statsData.gas_prices.slow || 0.01,
            average: statsData.gas_prices.average || 0.01,
            fast: statsData.gas_prices.fast || 0.01,
          };
        }

        isConnected = true;
      } catch (e) {
        console.warn("Error parsing stats data:", e);
      }
    }

    let totalAssets = 0;
    let totalTokenValue = 0;

    if (tokensResponse?.ok) {
      try {
        const tokensData = await tokensResponse.json();
        const tokens = tokensData.items || [];

        if (Array.isArray(tokens)) {
          totalAssets = tokens.length;

          totalTokenValue = tokens.reduce((sum: number, token: any) => {
            const supply = parseFloat(token.total_supply) || 0;
            const decimals = parseInt(token.decimals) || 18;
            const normalizedSupply = supply / Math.pow(10, decimals);
            return sum + normalizedSupply;
          }, 0);
        }
      } catch (e) {
        console.warn("Error parsing tokens data:", e);
      }
    }

    // Calculate derived values
    let tvl = "Connecting...";
    let volume24h = "Connecting...";
    let activeUsers = 0;

    if (isConnected) {
      // Estimate TVL based on network activity and gas usage
      const gasUsedTodayNum = parseFloat(gasUsedToday) || 0;
      const estimatedTVL = (gasUsedTodayNum / 1e18) * 100; // Rough estimation
      tvl = formatCurrency(estimatedTVL);

      // Estimate daily volume based on transactions today
      const avgTxValue = estimatedTVL / Math.max(transactionsToday, 1);
      volume24h = formatCurrency(avgTxValue * transactionsToday);

      // Estimate active users as percentage of total addresses
      activeUsers = Math.floor(
        totalAddresses * Math.min(networkUtilization / 100, 0.1)
      );
    }

    return {
      totalBlocks: totalBlocks || 0,
      totalTransactions: totalTransactions || 0,
      totalAssets: totalAssets || 0,
      networkHealth: isConnected
        ? networkUtilization > 80
          ? "congested"
          : "healthy"
        : "connecting",
      blockTime: blockTime || 2.0,
      validators: isConnected
        ? Math.max(Math.floor(totalBlocks / 100000), 1)
        : 0, // Estimate validators
      tvl,
      volume24h,
      activeUsers: Math.max(activeUsers, 0),
      totalAddresses: totalAddresses || 0,
      marketCap: isConnected
        ? formatCurrency(parseFloat(marketCap))
        : "Connecting...",
      isConnected,
      gasUsedToday: formatNumber(parseFloat(gasUsedToday) / 1e9), // Convert to Gwei
      transactionsToday: transactionsToday || 0,
      networkUtilization: networkUtilization || 0,
      gasPrices,
    };
  } catch (error) {
    console.warn("Error fetching blockchain stats:", error);
    // Return default values on error
    return {
      totalBlocks: 0,
      totalTransactions: 0,
      totalAssets: 0,
      networkHealth: "offline",
      blockTime: 0,
      validators: 0,
      tvl: "Network Offline",
      volume24h: "Network Offline",
      activeUsers: 0,
      totalAddresses: 0,
      marketCap: "Network Offline",
      isConnected: false,
      gasUsedToday: "0",
      transactionsToday: 0,
      networkUtilization: 0,
      gasPrices: { slow: 0.01, average: 0.01, fast: 0.01 },
    };
  }
}

// Fetch latest transactions - Static export compatible
export async function getLatestTransactions(
  limit = 10
): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/main-page/transactions`, {
      headers: {
        accept: "application/json",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      // Silently return empty array instead of throwing
      return [];
    }

    const data = await response.json();
    const transactions = data.items || [];

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    return transactions.slice(0, limit).map((tx: any) => ({
      hash: tx.hash || "",
      block: Number.parseInt(tx.block_number) || 0,
      timestamp: tx.timestamp || new Date().toISOString(),
      type: getTransactionType(tx),
      status: tx.status === "ok" ? "success" : tx.status || "pending",
      from: tx.from?.hash,
      to: tx.to?.hash,
      value: tx.value || "0",
      gasUsed: tx.gas_used || "0",
      gasPrice: tx.gas_price || "0",
      fee: tx.fee?.value || "0",
    }));
  } catch (error) {
    // Silently handle all errors and return empty array
    return [];
  }
}

// Helper function to determine transaction type
function getTransactionType(tx: any): string {
  if (tx.method) {
    const method = tx.method.toLowerCase();
    if (method.includes("mint")) return "Mint";
    if (method.includes("trade") || method.includes("swap")) return "Trade";
    if (method.includes("transfer")) return "Transfer";
    if (method.includes("approve")) return "Approve";
  }

  if (tx.transaction_types && Array.isArray(tx.transaction_types)) {
    const types = tx.transaction_types.map((t: string) => t.toLowerCase());
    if (types.includes("token_transfer")) return "Transfer";
    if (types.includes("contract_call")) return "Contract";
    if (types.includes("coin_transfer")) return "Transfer";
  }

  if (tx.to?.hash && tx.value && Number.parseInt(tx.value) > 0) {
    return "Transfer";
  }

  return "Contract";
}

// Format currency values
export function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  if (value >= 1) {
    return `$${value.toFixed(0)}`;
  }
  return "$0";
}

// Format large numbers for display
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Format time ago
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  }
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  }
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

// Format hash for display (truncate)
export function formatHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
