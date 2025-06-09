// Production token list configuration for BCTChain DEX
// This will be fetched from Cloudflare R2

export interface TokenList {
  name: string;
  logoURI: string;
  keywords: string[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: TokenInfo[];
}

export interface TokenInfo {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    bridgeInfo?: {
      [chainId: string]: {
        tokenAddress: string;
      };
    };
  };
}

// DEX Configuration - BCTChain production smart contract addresses
export const DEX_CONFIG = {
  // Core DEX contracts - BCTChain deployed addresses
  ROUTER_V2: "0x8146833DFB7998Ac0007704Ed447eb46a04d5D69", // BCTChain Router
  FACTORY_V2: "0x1ab5Df4e4f8520099bD5f31FaCCe010b1C8cb996", // BCTChain Factory

  // WETH address for BCTChain
  WETH: "0xa74d1fcc64cD9F701B42224A22778B1dCc447FCE",

  // Init code hash for pair creation (used for CREATE2 address calculation)
  INIT_CODE_HASH:
    "0x1a9080086fdb63e5bcdb8e2a340d2bd4de72c44ed57e894b7bcd5ca11f835317",

  // Native token info
  NATIVE_TOKEN: {
    symbol: "BCT",
    name: "BCT Chain Token",
    decimals: 18,
    address: "0x0000000000000000000000000000000000000000", // Use zero address for native token
  },

  // Chain configuration - BCTChain production details
  CHAIN_ID: 1190, // BCTChain chain ID
  CHAIN_NAME: "BCTChain",
  RPC_URL: "https://rpc.bctchain.com", // BCTChain RPC endpoint
  EXPLORER_URL: "https://scan.bctchain.com", // BCTChain explorer

  // Token list URL - Using local file for now, update with your actual R2 URL when deployed
  TOKEN_LIST_URL: "/bctchain-token-list.json",

  // Default slippage tolerance (in basis points, 50 = 0.5%)
  DEFAULT_SLIPPAGE: 50,

  // Gas settings
  GAS_LIMIT_MULTIPLIER: 1.5, // 20% buffer on gas estimates
  MAX_FEE_PER_GAS: "50000000000", // 50 gwei max
  MAX_PRIORITY_FEE_PER_GAS: "2000000000", // 2 gwei priority
};

// Example token list structure that should be uploaded to your Cloudflare R2
export const EXAMPLE_TOKEN_LIST: TokenList = {
  name: "BCTChain Default Token List",
  logoURI: "https://bctchain.com/logo.png",
  keywords: ["synthetic", "defi", "trading"],
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  tokens: [
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x0000000000000000000000000000000000000000",
      symbol: "BCT",
      name: "BCT Chain Token",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/bct.png",
      tags: ["native"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0xF9b35E5cD6B45459863B64d9208874DA5f0E43A0",
      symbol: "RAJ",
      name: "Rajavej coin",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/raj.png",
      tags: ["token"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x774F2aBBcAB2262c2E2bb15520Ddb788b84715b5",
      symbol: "LISA",
      name: "LISA COIN",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/lisa.png",
      tags: ["token"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x420000000000000000000000000000000000000",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/weth.png",
      tags: ["wrapped"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x49be54686D911D454bB0887FdE424e3C617dA683",
      symbol: "USDG",
      name: "USD Gold",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/usdg.png",
      tags: ["stablecoin"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0xa74d1fcc64cD9F701B42224A22778B1dCc447FCE",
      symbol: "BCT",
      name: "BCT Chain Token",
      decimals: 18,
      logoURI: "https://bctchain.com/tokens/bct.png",
      tags: ["wrapped"],
    },
  ],
};

// Token list fetcher
export class TokenListService {
  private static tokenList: TokenList | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async fetchTokenList(): Promise<TokenList> {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (this.tokenList && now - this.lastFetch < this.CACHE_DURATION) {
      return this.tokenList;
    }

    try {
      const response = await fetch(DEX_CONFIG.TOKEN_LIST_URL, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.status}`);
      }

      const tokenList: TokenList = await response.json();

      // Validate the token list structure
      if (!this.validateTokenList(tokenList)) {
        throw new Error("Invalid token list format");
      }

      this.tokenList = tokenList;
      this.lastFetch = now;

      return tokenList;
    } catch (error) {
      console.warn("Failed to fetch token list, using fallback:", error);

      // Return cached data if available
      if (this.tokenList) {
        return this.tokenList;
      }

      // Use example token list as final fallback
      console.info("Using example token list as fallback");
      this.tokenList = EXAMPLE_TOKEN_LIST;
      this.lastFetch = now;

      return EXAMPLE_TOKEN_LIST;
    }
  }

  static async getTokenByAddress(address: string): Promise<TokenInfo | null> {
    const tokenList = await this.fetchTokenList();
    return (
      tokenList.tokens.find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
      ) || null
    );
  }

  static async getTokenBySymbol(symbol: string): Promise<TokenInfo | null> {
    const tokenList = await this.fetchTokenList();
    return (
      tokenList.tokens.find(
        (token) => token.symbol.toLowerCase() === symbol.toLowerCase()
      ) || null
    );
  }

  static async searchTokens(query: string): Promise<TokenInfo[]> {
    const tokenList = await this.fetchTokenList();
    const lowerQuery = query.toLowerCase();

    return tokenList.tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase().includes(lowerQuery)
    );
  }

  private static validateTokenList(tokenList: any): tokenList is TokenList {
    return (
      tokenList &&
      typeof tokenList.name === "string" &&
      Array.isArray(tokenList.tokens) &&
      tokenList.tokens.every(
        (token: any) =>
          token.address &&
          token.symbol &&
          token.name &&
          typeof token.decimals === "number" &&
          typeof token.chainId === "number"
      )
    );
  }
}

export default TokenListService;
