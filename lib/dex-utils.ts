// DEX Utility functions for BCTChain
// This file contains mock implementations that will be replaced with real contract calls

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  price?: number;
  balance?: string;
}

export interface SwapRoute {
  path: string[];
  pools: string[];
  fees: number[];
  gasEstimate: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  fee: number;
  route: SwapRoute;
  estimatedGas: string;
  expiresAt: number;
  minAmountOut: string;
}

export interface SwapParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  slippage: number;
  recipient?: string;
  deadline?: number;
}

// Mock token list - replace with real token registry
export const MOCK_TOKENS: Token[] = [
  {
    symbol: "sBTC",
    name: "Synthetic Bitcoin",
    address: "0x1234567890123456789012345678901234567890",
    decimals: 8,
    chainId: 1,
    price: 43250.0,
    balance: "0.12345678",
  },
  {
    symbol: "sETH",
    name: "Synthetic Ethereum",
    address: "0x2345678901234567890123456789012345678901",
    decimals: 18,
    chainId: 1,
    price: 2680.0,
    balance: "2.5647891",
  },
  {
    symbol: "sUSD",
    name: "Synthetic USD",
    address: "0x3456789012345678901234567890123456789012",
    decimals: 18,
    chainId: 1,
    price: 1.0,
    balance: "1000.00",
  },
  {
    symbol: "sGOLD",
    name: "Synthetic Gold",
    address: "0x4567890123456789012345678901234567890123",
    decimals: 18,
    chainId: 1,
    price: 2045.0,
    balance: "5.2341",
  },
  {
    symbol: "sOIL",
    name: "Synthetic Oil",
    address: "0x5678901234567890123456789012345678901234",
    decimals: 18,
    chainId: 1,
    price: 78.5,
    balance: "15.789",
  },
  {
    symbol: "sSPX",
    name: "Synthetic S&P 500",
    address: "0x6789012345678901234567890123456789012345",
    decimals: 18,
    chainId: 1,
    price: 4567.0,
    balance: "0.8745",
  },
];

// Mock DEX contract addresses - replace with real deployed contracts
export const DEX_CONTRACTS = {
  ROUTER: "0x1111111111111111111111111111111111111111",
  FACTORY: "0x2222222222222222222222222222222222222222",
  QUOTER: "0x3333333333333333333333333333333333333333",
  MULTICALL: "0x4444444444444444444444444444444444444444",
};

// Mock price oracle for getting real-time prices
export class MockPriceOracle {
  private static prices: Map<string, number> = new Map();

  static async getPrice(tokenAddress: string): Promise<number> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const token = MOCK_TOKENS.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    if (token && token.price) {
      // Add some random fluctuation (±2%)
      const fluctuation = (Math.random() - 0.5) * 0.04;
      return token.price * (1 + fluctuation);
    }
    return 0;
  }

  static async getPrices(
    tokenAddresses: string[]
  ): Promise<Map<string, number>> {
    const prices = new Map<string, number>();
    for (const address of tokenAddresses) {
      prices.set(address, await this.getPrice(address));
    }
    return prices;
  }
}

// Mock swap quoter
export class MockSwapQuoter {
  static async getQuote(params: SwapParams): Promise<SwapQuote | null> {
    const { fromToken, toToken, amount, slippage } = params;

    if (!amount || isNaN(parseFloat(amount))) return null;

    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    const fromAmount = parseFloat(amount);
    const fromPrice = await MockPriceOracle.getPrice(fromToken.address);
    const toPrice = await MockPriceOracle.getPrice(toToken.address);

    if (fromPrice === 0 || toPrice === 0) return null;

    // Calculate base conversion rate
    const rate = fromPrice / toPrice;
    const baseToAmount = fromAmount * rate;

    // Apply price impact (0-2% based on trade size)
    const tradeSize = fromAmount * fromPrice;
    const priceImpact = Math.min(2, Math.sqrt(tradeSize / 10000) * 0.5);
    const adjustedToAmount = baseToAmount * (1 - priceImpact / 100);

    // Calculate minimum amount out with slippage
    const minAmountOut = adjustedToAmount * (1 - slippage / 100);

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: adjustedToAmount.toFixed(6),
      priceImpact,
      fee: 0.1, // 0.1% protocol fee
      route: {
        path: [fromToken.address, toToken.address],
        pools: [`${fromToken.address}-${toToken.address}`],
        fees: [3000], // 0.3% pool fee in basis points
        gasEstimate: "150000",
      },
      estimatedGas: "0.002",
      expiresAt: Date.now() + 30000, // 30 seconds
      minAmountOut: minAmountOut.toFixed(6),
    };
  }

  static async getBestRoute(
    fromToken: Token,
    toToken: Token,
    amount: string
  ): Promise<SwapRoute[]> {
    // Mock multiple routing options
    return [
      {
        path: [fromToken.address, toToken.address],
        pools: [`${fromToken.address}-${toToken.address}`],
        fees: [3000],
        gasEstimate: "150000",
      },
      {
        path: [fromToken.address, MOCK_TOKENS[2].address, toToken.address], // Route through sUSD
        pools: [
          `${fromToken.address}-${MOCK_TOKENS[2].address}`,
          `${MOCK_TOKENS[2].address}-${toToken.address}`,
        ],
        fees: [3000, 3000],
        gasEstimate: "220000",
      },
    ];
  }
}

// Mock swap executor
export class MockSwapExecutor {
  static async executeSwap(
    quote: SwapQuote,
    recipient?: string
  ): Promise<string> {
    // Simulate transaction execution
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 3000)
    );

    // Simulate success/failure (95% success rate)
    if (Math.random() > 0.95) {
      throw new Error("Transaction failed: Insufficient liquidity");
    }

    // Return mock transaction hash
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }
}

// Utility functions
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 18
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num === 0) return "0";
  if (num < 0.000001) return num.toExponential(2);
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString();
}

export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  const num = parseFloat(amount);
  return BigInt(Math.floor(num * Math.pow(10, decimals)));
}

export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  inputPrice: number,
  outputPrice: number
): number {
  const expectedOutput = (inputAmount * inputPrice) / outputPrice;
  return ((expectedOutput - outputAmount) / expectedOutput) * 100;
}

export function calculateMinimumReceived(
  amount: string,
  slippage: number
): string {
  const num = parseFloat(amount);
  return (num * (1 - slippage / 100)).toFixed(6);
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(
    42 - chars
  )}`;
}

// Token search and filtering
export function searchTokens(
  query: string,
  tokens: Token[] = MOCK_TOKENS
): Token[] {
  if (!query) return tokens;

  const lowerQuery = query.toLowerCase();
  return tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase().includes(lowerQuery)
  );
}

export function sortTokensByBalance(tokens: Token[]): Token[] {
  return [...tokens].sort((a, b) => {
    const balanceA = parseFloat(a.balance || "0");
    const balanceB = parseFloat(b.balance || "0");
    return balanceB - balanceA;
  });
}

// Gas estimation utilities
export function estimateGasPrice(): Promise<string> {
  // Mock gas price in gwei
  return Promise.resolve((20 + Math.random() * 50).toFixed(1));
}

export function calculateGasCost(gasLimit: string, gasPrice: string): string {
  const cost = (parseFloat(gasLimit) * parseFloat(gasPrice)) / 1e9; // Convert to ETH
  return cost.toFixed(6);
}
