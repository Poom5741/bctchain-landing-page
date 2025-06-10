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

  // Token list URL - Cloudflare R2 hosted token list with environment variable support
  TOKEN_LIST_URL:
    process.env.NEXT_PUBLIC_TOKEN_LIST_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://pub-65a77754903f4bddb48f3852b3967938.r2.dev/bctchain-token-list.json"
      : "/bctchain-token-list.json"), // Local fallback for development

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
  logoURI:
    "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/bctchain-logo.png",
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
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/bct.png",
      tags: ["native"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0xF9b35E5cD6B45459863B64d9208874DA5f0E43A0",
      symbol: "RAJ",
      name: "Rajavej coin",
      decimals: 18,
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/raj.png",
      tags: ["token"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x774F2aBBcAB2262c2E2bb15520Ddb788b84715b5",
      symbol: "LISA",
      name: "LISA COIN",
      decimals: 18,
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/lisa.png",
      tags: ["token"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/weth.png",
      tags: ["wrapped"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0x49be54686D911D454bB0887FdE424e3C617dA683",
      symbol: "USDG",
      name: "USD Gold",
      decimals: 6,
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/usdg.png",
      tags: ["stablecoin"],
    },
    {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: "0xa74d1fcc64cD9F701B42224A22778B1dCc447FCE",
      symbol: "WBCT",
      name: "Wrapped BCT",
      decimals: 18,
      logoURI:
        "https://a1d68d92ed0cda5cea113ff208eba3a1.r2.cloudflarestorage.com/bct-landing-tokenlist/bct.png",
      tags: ["wrapped"],
    },
  ],
};

// Token list fetcher with Cloudflare R2 optimization
export class TokenListService {
  private static tokenList: TokenList | null = null;
  private static lastFetch: number = 0;
  private static readonly CACHE_DURATION = parseInt(
    process.env.NEXT_PUBLIC_TOKEN_LIST_CACHE_DURATION || "300000"
  ); // Default 5 minutes
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRIES = 3;
  private static readonly DEBUG =
    process.env.NEXT_PUBLIC_TOKEN_LIST_DEBUG === "true";

  static async fetchTokenList(forceRefresh = false): Promise<TokenList> {
    const now = Date.now();

    if (this.DEBUG) {
      console.debug("TokenListService.fetchTokenList called", {
        forceRefresh,
        hasCachedData: !!this.tokenList,
        cacheAge: this.lastFetch > 0 ? now - this.lastFetch : 0,
        cacheExpired: now - this.lastFetch > this.CACHE_DURATION,
      });
    }

    // Return cached data if it's still fresh and not forcing refresh
    if (
      !forceRefresh &&
      this.tokenList &&
      now - this.lastFetch < this.CACHE_DURATION
    ) {
      if (this.DEBUG) {
        console.debug("Returning cached token list");
      }
      return this.tokenList;
    }

    let lastError: Error | null = null;

    if (this.DEBUG) {
      console.debug("Fetching token list from URL:", DEX_CONFIG.TOKEN_LIST_URL);
    }

    // Try fetching with retries
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(DEX_CONFIG.TOKEN_LIST_URL, {
          headers: {
            Accept: "application/json",
            "Cache-Control": forceRefresh ? "no-cache" : "max-age=300",
            "User-Agent": "BCTChain-DEX/1.0",
          },
          // Add timeout for R2 requests
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const tokenList: TokenList = await response.json();

        // Validate the token list structure
        if (!this.validateTokenList(tokenList)) {
          throw new Error("Invalid token list format received from R2");
        }

        // Check if this is a newer version than what we have cached
        if (
          this.tokenList &&
          this.isNewerVersion(tokenList.version, this.tokenList.version)
        ) {
          console.info(
            "Updated token list version detected:",
            tokenList.version
          );
        }

        this.tokenList = tokenList;
        this.lastFetch = now;

        const message = `Token list fetched successfully (${tokenList.tokens.length} tokens, v${tokenList.version.major}.${tokenList.version.minor}.${tokenList.version.patch})`;
        if (this.DEBUG) {
          console.debug(message);
        } else {
          console.info(message);
        }

        return tokenList;
      } catch (error) {
        lastError = error as Error;
        const errorMessage = `Token list fetch attempt ${attempt}/${this.MAX_RETRIES} failed: ${error}`;

        if (this.DEBUG) {
          console.debug(errorMessage);
        } else {
          console.warn(errorMessage);
        }

        if (attempt < this.MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY * attempt)
          );
        }
      }
    }

    console.error("All token list fetch attempts failed:", lastError);

    // Return cached data if available
    if (this.tokenList) {
      console.info("Using cached token list due to fetch failure");
      return this.tokenList;
    }

    // Use example token list as final fallback
    console.info("Using example token list as fallback");
    this.tokenList = EXAMPLE_TOKEN_LIST;
    this.lastFetch = now;

    return EXAMPLE_TOKEN_LIST;
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

  private static isNewerVersion(
    newVersion: { major: number; minor: number; patch: number },
    currentVersion: { major: number; minor: number; patch: number }
  ): boolean {
    if (newVersion.major > currentVersion.major) return true;
    if (newVersion.major < currentVersion.major) return false;

    if (newVersion.minor > currentVersion.minor) return true;
    if (newVersion.minor < currentVersion.minor) return false;

    return newVersion.patch > currentVersion.patch;
  }

  // Utility method to get cache info
  static getCacheInfo(): {
    hasCachedData: boolean;
    lastFetch: Date | null;
    cacheAge: number;
    isExpired: boolean;
  } {
    const now = Date.now();
    return {
      hasCachedData: this.tokenList !== null,
      lastFetch: this.lastFetch > 0 ? new Date(this.lastFetch) : null,
      cacheAge: this.lastFetch > 0 ? now - this.lastFetch : 0,
      isExpired:
        this.lastFetch > 0 ? now - this.lastFetch > this.CACHE_DURATION : true,
    };
  }

  // Method to clear cache (useful for admin/debugging)
  static clearCache(): void {
    this.tokenList = null;
    this.lastFetch = 0;
    console.info("Token list cache cleared");
  }

  // Method to get current token list version
  static getCurrentVersion(): {
    major: number;
    minor: number;
    patch: number;
  } | null {
    return this.tokenList?.version || null;
  }

  // Utility method to get token logo URL by address or symbol
  static async getTokenLogo(
    tokenAddressOrSymbol: string
  ): Promise<string | null> {
    try {
      const tokenList = await this.fetchTokenList();

      // First try to find by address
      let token = tokenList.tokens.find(
        (t) => t.address.toLowerCase() === tokenAddressOrSymbol.toLowerCase()
      );

      // If not found by address, try by symbol
      if (!token) {
        token = tokenList.tokens.find(
          (t) => t.symbol.toLowerCase() === tokenAddressOrSymbol.toLowerCase()
        );
      }

      return token?.logoURI || null;
    } catch (error) {
      console.error("Failed to get token logo:", error);
      return null;
    }
  }

  // Utility method to get all token logos as a map
  static async getTokenLogoMap(): Promise<{
    [symbolOrAddress: string]: string;
  }> {
    try {
      const tokenList = await this.fetchTokenList();
      const logoMap: { [key: string]: string } = {};

      tokenList.tokens.forEach((token) => {
        if (token.logoURI) {
          // Map by symbol (primary key)
          logoMap[token.symbol] = token.logoURI;
          // Also map by address for flexibility
          logoMap[token.address.toLowerCase()] = token.logoURI;
        }
      });

      return logoMap;
    } catch (error) {
      console.error("Failed to get token logo map:", error);
      return {};
    }
  }
}

export default TokenListService;
