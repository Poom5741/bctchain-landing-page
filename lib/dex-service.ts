// Production DEX service for interacting with BCTChain smart contracts
import {
  BrowserProvider,
  Contract,
  ZeroAddress,
  formatUnits,
  parseUnits,
  Interface,
  AbiCoder,
  MaxUint256,
} from "ethers";
import { DEX_CONFIG, EXAMPLE_TOKEN_LIST, TokenInfo } from "./token-list";

// Uniswap V2 Router ABI (minimal interface)
const ROUTER_V2_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
  "function WETH() external pure returns (address)",
];

// ERC20 Token ABI (minimal interface)
const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

// Uniswap V2 Factory ABI (minimal interface)
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function createPair(address tokenA, address tokenB) external returns (address pair)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)",
];

// Uniswap V2 Pair ABI (minimal interface)
const PAIR_ABI = [
  "function name() external pure returns (string)",
  "function symbol() external pure returns (string)",
  "function decimals() external pure returns (uint8)",
  "function totalSupply() external view returns (uint)",
  "function balanceOf(address owner) external view returns (uint)",
  "function allowance(address owner, address spender) external view returns (uint)",
  "function approve(address spender, uint value) external returns (bool)",
  "function transfer(address to, uint value) external returns (bool)",
  "function transferFrom(address from, address to, uint value) external returns (bool)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

export interface SwapQuote {
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
  route: string[];
  gasEstimate: string;
  minimumReceived: string;
  expiresAt: number;
}

export interface SwapParams {
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  inputAmount: string;
  slippageTolerance: number; // in basis points (50 = 0.5%)
  recipient?: string;
  deadline?: number; // timestamp in seconds
}

export interface AddLiquidityParams {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  amountADesired: string;
  amountBDesired: string;
  slippageTolerance: number; // in basis points (50 = 0.5%)
  recipient?: string;
  deadline?: number; // timestamp in seconds
}

export interface RemoveLiquidityParams {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  liquidity: string;
  slippageTolerance: number; // in basis points (50 = 0.5%)
  recipient?: string;
  deadline?: number; // timestamp in seconds
}

export interface LiquidityPool {
  id: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  lpTokenBalance?: string;
  apy?: number;
}

export class DexService {
  public provider?: BrowserProvider;
  private routerContract?: Contract;
  private factoryContract?: Contract;

  constructor(provider?: BrowserProvider) {
    this.init(provider); // Call the new init method
  }

  /**
   * Initializes or re-initializes the DexService with a provider.
   * Sets up the provider and associated contracts.
   * Clears contracts if the provider is undefined.
   */
  public init(provider?: BrowserProvider) {
    if (provider) {
      this.provider = provider;
      this.routerContract = new Contract(
        DEX_CONFIG.ROUTER_V2,
        ROUTER_V2_ABI,
        provider
      );
      this.factoryContract = new Contract(
        DEX_CONFIG.FACTORY_V2,
        FACTORY_ABI,
        provider
      );
      console.log("DexService: Provider and contracts initialized.");
    } else {
      this.provider = undefined;
      this.routerContract = undefined;
      this.factoryContract = undefined;
      console.warn(
        "DexService: Initialized without provider or provider removed. Contracts are cleared."
      );
    }
  }

  // Ensure this method is correctly defined if it was part of previous changes
  public static parseDecimalToWeiBigInt(
    decimalAmount: string,
    decimals: number
  ): bigint {
    if (!decimalAmount || isNaN(parseFloat(decimalAmount))) {
      console.warn(
        `Invalid decimalAmount: ${decimalAmount} for parseDecimalToWeiBigInt`
      );
      return BigInt(0);
    }
    try {
      return parseUnits(decimalAmount, decimals);
    } catch (error) {
      console.error(
        `Error parsing decimal to wei: ${decimalAmount}, decimals: ${decimals}`,
        error
      );
      // Attempt to handle potential precision issues or very small numbers
      // This is a simplistic fallback, consider a more robust solution if errors persist
      const parts = decimalAmount.split(".");
      if (parts.length === 2 && parts[1].length > decimals) {
        return parseUnits(
          parts[0] + "." + parts[1].substring(0, decimals),
          decimals
        );
      }
      return BigInt(0);
    }
  }

  public static formatWeiToDecimal(
    wei: string | bigint,
    decimals: number
  ): string {
    try {
      const result = formatUnits(BigInt(wei), decimals);
      // console.log(`formatWeiToDecimal: wei=${wei}, decimals=${decimals}, result=${result}`);
      return result;
    } catch (error) {
      console.error(
        `Error formatting wei to decimal: wei=${wei}, decimals=${decimals}`,
        error
      );
      return "0.0";
    }
  }

  private async getNativeTokenBalance(walletAddress: string): Promise<bigint> {
    if (!this.provider) {
      console.error("Provider not available for getNativeTokenBalance.");
      return BigInt(0);
    }
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return balance;
    } catch (error) {
      console.error("Error fetching native token balance:", error);
      return BigInt(0);
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string,
    decimals: number
  ): Promise<{ wei: bigint; formatted: string }> {
    if (!this.provider) {
      console.error("Provider not available for getTokenBalance.");
      return { wei: BigInt(0), formatted: "0.0" };
    }
    if (!walletAddress || !tokenAddress) {
      console.warn(
        "Wallet address or token address is missing for getTokenBalance."
      );
      return { wei: BigInt(0), formatted: "0.0" };
    }

    let balanceWei: bigint;

    if (
      tokenAddress === ZeroAddress ||
      tokenAddress.toLowerCase() ===
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      balanceWei = await this.getNativeTokenBalance(walletAddress);
    } else {
      try {
        const tokenContract = new Contract(
          tokenAddress,
          ERC20_ABI,
          this.provider
        );
        balanceWei = await tokenContract.balanceOf(walletAddress);
      } catch (error) {
        console.error(
          `Error fetching ERC20 token balance for ${tokenAddress}:`,
          error
        );
        balanceWei = BigInt(0);
      }
    }
    return {
      wei: balanceWei,
      formatted: DexService.formatWeiToDecimal(balanceWei, decimals),
    };
  }

  async getUserTokenBalances(
    walletAddress: string
  ): Promise<
    Record<
      string,
      { balance: string; decimals: number; name: string; symbol: string }
    >
  > {
    if (!walletAddress) {
      console.warn("Wallet address is not provided to getUserTokenBalances.");
      return {};
    }
    if (!this.provider) {
      console.warn(
        "Provider not available for getUserTokenBalances. Returning empty balances."
      );
      return {};
    }
    console.log("Fetching user token balances for:", walletAddress);

    const tokens = EXAMPLE_TOKEN_LIST.tokens;

    if (!tokens || tokens.length === 0) {
      console.warn(
        "No tokens found in the token list for getUserTokenBalances."
      );
      return {};
    }

    const balances: Record<
      string,
      { balance: string; decimals: number; name: string; symbol: string }
    > = {};

    for (const token of tokens) {
      try {
        if (
          !token.address ||
          typeof token.address !== "string" ||
          !/^0x[a-fA-F0-9]{40}$/.test(token.address)
        ) {
          console.warn(
            `Invalid address for token ${token.symbol}: ${token.address}`
          );
          continue;
        }
        // Fetch native token balance if address is zero or matches native token address
        if (
          token.address === ZeroAddress ||
          token.address.toLowerCase() ===
            DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
        ) {
          const nativeBalanceData = await this.getTokenBalance(
            walletAddress,
            DEX_CONFIG.NATIVE_TOKEN.address,
            DEX_CONFIG.NATIVE_TOKEN.decimals
          );
          balances[DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()] = {
            balance: nativeBalanceData.formatted,
            decimals: DEX_CONFIG.NATIVE_TOKEN.decimals,
            name: DEX_CONFIG.NATIVE_TOKEN.name,
            symbol: DEX_CONFIG.NATIVE_TOKEN.symbol,
          };
        } else {
          const balanceData = await this.getTokenBalance(
            walletAddress,
            token.address,
            token.decimals
          );
          balances[token.address.toLowerCase()] = {
            balance: balanceData.formatted,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
          };
        }
      } catch (error) {
        console.error(
          `Error fetching balance for ${token.symbol} (${token.address}):`,
          error
        );
        balances[token.address.toLowerCase()] = {
          balance: "0",
          decimals: token.decimals,
          name: token.name,
          symbol: token.symbol,
        };
      }
    }
    console.log("User token balances fetched:", balances);
    return balances;
  }

  async ensureTokenAllowance(
    walletAddress: string,
    tokenAddress: string,
    spenderAddress: string,
    requiredAmountWei: bigint
  ): Promise<boolean> {
    if (!this.provider) {
      console.error("Provider not available for ensureTokenAllowance.");
      return false;
    }
    if (
      tokenAddress === ZeroAddress ||
      tokenAddress.toLowerCase() ===
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      return true; // Native tokens don't need allowance
    }

    const signer = await this.provider.getSigner(walletAddress);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

    try {
      const currentAllowance = await tokenContract.allowance(
        walletAddress,
        spenderAddress
      );
      console.log(
        `Current allowance for ${tokenAddress} by ${walletAddress} to ${spenderAddress}: ${currentAllowance.toString()} wei`
      );
      console.log(`Required amount: ${requiredAmountWei.toString()} wei`);

      if (BigInt(currentAllowance) < requiredAmountWei) {
        console.log(
          `Insufficient allowance. Requesting approval for ${MaxUint256.toString()} wei...`
        );
        const approveTx = await tokenContract.approve(
          spenderAddress,
          MaxUint256
        );
        console.log("Approval transaction sent:", approveTx.hash);
        const receipt = await approveTx.wait();
        if (receipt && receipt.status === 1) {
          console.log("Approval successful:", receipt.transactionHash);
          return true;
        } else {
          console.error("Approval transaction failed:", receipt);
          return false;
        }
      }
      console.log("Sufficient allowance already granted.");
      return true;
    } catch (error) {
      console.error("Error in ensureTokenAllowance:", error);
      return false;
    }
  }

  async getSwapQuote(
    tokenInAddress: string,
    tokenOutAddress: string,
    amountInDecimal: string, // Amount of tokenIn to swap, in decimal format
    tokenInDecimals: number
  ): Promise<{ amountOutDecimal: string; path: string[]; amounts: bigint[] }> {
    if (!this.routerContract) {
      console.error("Router contract not initialized in getSwapQuote.");
      return { amountOutDecimal: "0", path: [], amounts: [] };
    }
    if (!amountInDecimal || parseFloat(amountInDecimal) <= 0) {
      console.warn("Amount in must be greater than 0 for getSwapQuote.");
      return { amountOutDecimal: "0", path: [], amounts: [] };
    }

    const amountInWei = DexService.parseDecimalToWeiBigInt(
      amountInDecimal,
      tokenInDecimals
    );
    if (amountInWei === BigInt(0)) {
      console.warn("Parsed amountInWei is 0. Cannot get swap quote.");
      return { amountOutDecimal: "0", path: [], amounts: [] };
    }

    const path = [tokenInAddress, tokenOutAddress];
    // If one of the tokens is native, use WETH for routing
    if (
      tokenInAddress === ZeroAddress ||
      tokenInAddress.toLowerCase() ===
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      path[0] = DEX_CONFIG.WETH;
    }
    if (
      tokenOutAddress === ZeroAddress ||
      tokenOutAddress.toLowerCase() ===
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      path[1] = DEX_CONFIG.WETH;
    }

    // If both are non-WETH and non-Native, consider a path through WETH
    // For simplicity, direct path or via WETH. More complex routing might be needed.
    const actualPath =
      path[0] === DEX_CONFIG.WETH ||
      path[1] === DEX_CONFIG.WETH ||
      path[0] === path[1] ||
      path.length > 2
        ? path
        : [path[0], DEX_CONFIG.WETH, path[1]];

    console.log(
      `getSwapQuote: amountIn=${amountInDecimal} (${amountInWei} wei), path=${actualPath.join(
        " -> "
      )}`
    );

    try {
      // The return type of getAmountsOut is `bigint[]` as per ethers v6 Contract typing if ABI is correct.
      // If it's `any[]` or `Result`, explicit casting/conversion is needed.
      const amountsOut: bigint[] = await this.routerContract.getAmountsOut(
        amountInWei,
        actualPath
      );
      const tokenOutDecimals = await this.getTokenDecimals(
        actualPath[actualPath.length - 1]
      );

      const amountOutFormatted = DexService.formatWeiToDecimal(
        amountsOut[amountsOut.length - 1],
        tokenOutDecimals
      );
      console.log(
        `Quote received: ${amountOutFormatted} of ${
          actualPath[actualPath.length - 1]
        }`
      );
      return {
        amountOutDecimal: amountOutFormatted,
        path: actualPath,
        amounts: amountsOut.map((a) => BigInt(a.toString())), // Ensure BigInt, though should already be
      };
    } catch (error: any) {
      console.error("Error getting swap quote:", error);
      if (error.data) {
        try {
          const decodedError = this.routerContract.interface.parseError(
            error.data
          );
          console.error(
            "Decoded revert reason:",
            decodedError?.name,
            decodedError?.args
          );
        } catch (e) {
          console.error("Could not decode revert reason from error.data");
        }
      }
      return { amountOutDecimal: "0", path: actualPath, amounts: [] };
    }
  }

  async executeSwap(
    walletAddress: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountInDecimal: string, // amount of tokenIn to swap, in decimal
    amountOutMinDecimal: string, // minimum amount of tokenOut expected, in decimal
    path: string[], // The path for the swap, e.g., [tokenIn, WETH, tokenOut]
    deadlineMinutes: number = 20
  ): Promise<string | null> {
    if (!this.provider || !this.routerContract) {
      console.error(
        "Provider or router contract not initialized for executeSwap."
      );
      return null;
    }
    const signer = await this.provider.getSigner(walletAddress);
    const routerWithSigner = this.routerContract.connect(signer) as Contract;

    const tokenIn =
      EXAMPLE_TOKEN_LIST.tokens.find(
        (t) => t.address.toLowerCase() === tokenInAddress.toLowerCase()
      ) ||
      (tokenInAddress.toLowerCase() ===
      DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
        ? DEX_CONFIG.NATIVE_TOKEN
        : undefined);
    const tokenOut =
      EXAMPLE_TOKEN_LIST.tokens.find(
        (t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase()
      ) ||
      (tokenOutAddress.toLowerCase() ===
      DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
        ? DEX_CONFIG.NATIVE_TOKEN
        : undefined);

    if (!tokenIn || !tokenOut) {
      console.error("Could not find token info for swap execution.");
      return null;
    }

    const amountInWei = DexService.parseDecimalToWeiBigInt(
      amountInDecimal,
      tokenIn.decimals
    );
    const amountOutMinWei = DexService.parseDecimalToWeiBigInt(
      amountOutMinDecimal,
      tokenOut.decimals
    );

    if (amountInWei <= BigInt(0) || amountOutMinWei < BigInt(0)) {
      // amountOutMin can be 0 for market orders if allowed
      console.error("Invalid amounts for swap execution.");
      return null;
    }

    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const to = walletAddress; // Receiver of the output tokens

    console.log("Executing swap with params:", {
      walletAddress,
      tokenInAddress,
      tokenOutAddress,
      amountInDecimal,
      amountOutMinDecimal,
      path,
      deadline,
    });

    // Ensure allowance for tokenIn if it's not the native token
    if (
      tokenInAddress !== ZeroAddress &&
      tokenInAddress.toLowerCase() !==
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      const allowanceOK = await this.ensureTokenAllowance(
        walletAddress,
        tokenInAddress,
        DEX_CONFIG.ROUTER_V2,
        amountInWei
      );
      if (!allowanceOK) {
        console.error("Token allowance not granted or failed.");
        return null;
      }
    }

    let tx;
    const gasOptions = await this.getGasOptions();

    try {
      if (
        tokenInAddress === ZeroAddress ||
        tokenInAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        // Swap ETH for Tokens
        console.log("Executing swapExactETHForTokens...");
        tx = await routerWithSigner.swapExactETHForTokens(
          amountOutMinWei,
          path,
          to,
          deadline,
          { ...gasOptions, value: amountInWei }
        );
      } else if (
        tokenOutAddress === ZeroAddress ||
        tokenOutAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        // Swap Tokens for ETH
        console.log("Executing swapExactTokensForETH...");
        tx = await routerWithSigner.swapExactTokensForETH(
          amountInWei,
          amountOutMinWei,
          path,
          to,
          deadline,
          gasOptions
        );
      } else {
        // Swap Tokens for Tokens
        console.log("Executing swapExactTokensForTokens...");
        tx = await routerWithSigner.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          path,
          to,
          deadline,
          gasOptions
        );
      }
      console.log("Swap transaction sent:", tx.hash);
      return tx.hash;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in DexService:", error.message);
        const errorData = (error as any)?.data;
        if (errorData) {
          try {
            const decodedError =
              this.routerContract?.interface.parseError(errorData);
            console.error(
              "Decoded revert reason:",
              decodedError?.name,
              decodedError?.args
            );
          } catch (e) {
            console.error("Could not decode revert reason from error.data");
          }
        }
        const transactionHash = (error as any)?.transactionHash;
        if (transactionHash) {
          console.error("Transaction hash (if available):", transactionHash);
        }
      } else {
        console.error("Unknown error type:", error);
      }
      throw new Error(
        `Transaction failed: ${(error as any)?.message || "Unknown error"}`
      );
    }
  }

  async addLiquidity(
    walletAddress: string,
    tokenAAddress: string,
    tokenBAddress: string,
    amountADesiredDecimal: string,
    amountBDesiredDecimal: string,
    amountAMinDecimal: string, // Minimum amount of token A to add after slippage
    amountBMinDecimal: string, // Minimum amount of token B to add after slippage
    deadlineMinutes: number = 20
  ): Promise<string | null> {
    if (!this.provider || !this.routerContract) {
      console.error(
        "Provider or router contract not initialized for addLiquidity."
      );
      return null;
    }
    const signer = await this.provider.getSigner(walletAddress);
    const routerWithSigner = this.routerContract.connect(signer) as Contract;

    const tokenAInfo = this.getTokenInfoByAddress(tokenAAddress);
    const tokenBInfo = this.getTokenInfoByAddress(tokenBAddress);

    if (!tokenAInfo || !tokenBInfo) {
      console.error(
        "Token info not found for one or both tokens in addLiquidity."
      );
      return null;
    }

    if (
      (tokenAAddress === ZeroAddress ||
        tokenAAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()) &&
      (tokenBAddress === ZeroAddress ||
        tokenBAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase())
    ) {
      console.error(
        "Cannot add liquidity for two native tokens. One must be an ERC20 token (WETH)."
      );
      // Or, automatically convert one to WETH if that's desired behavior
      return null;
    }

    const amountADesiredWei = DexService.parseDecimalToWeiBigInt(
      amountADesiredDecimal,
      tokenAInfo.decimals
    );
    const amountBDesiredWei = DexService.parseDecimalToWeiBigInt(
      amountBDesiredDecimal,
      tokenBInfo.decimals
    );
    const amountAMinWei = DexService.parseDecimalToWeiBigInt(
      amountAMinDecimal,
      tokenAInfo.decimals
    );
    const amountBMinWei = DexService.parseDecimalToWeiBigInt(
      amountBMinDecimal,
      tokenBInfo.decimals
    );

    if (amountADesiredWei <= BigInt(0) || amountBDesiredWei <= BigInt(0)) {
      console.error("Desired amounts for liquidity must be greater than zero.");
      return null;
    }
    if (amountAMinWei < BigInt(0) || amountBMinWei < BigInt(0)) {
      // Min amounts can be 0 if absolutely no slippage protection is desired (not recommended)
      console.error("Minimum amounts for liquidity cannot be negative.");
      return null;
    }

    // Pre-transaction balance checks
    const balanceAData = await this.getTokenBalance(
      walletAddress,
      tokenAAddress,
      tokenAInfo.decimals
    );
    if (balanceAData.wei < amountADesiredWei) {
      console.error(
        `Insufficient balance for token A. Required: ${amountADesiredDecimal}, Available: ${balanceAData.formatted}`
      );
      // Consider throwing an error or returning a specific message
      throw new Error(
        `Insufficient ${tokenAInfo.symbol} balance. Required: ${amountADesiredDecimal}, Available: ${balanceAData.formatted}`
      );
    }

    const balanceBData = await this.getTokenBalance(
      walletAddress,
      tokenBAddress,
      tokenBInfo.decimals
    );
    if (balanceBData.wei < amountBDesiredWei) {
      console.error(
        `Insufficient balance for token B. Required: ${amountBDesiredDecimal}, Available: ${balanceBData.formatted}`
      );
      throw new Error(
        `Insufficient ${tokenBInfo.symbol} balance. Required: ${amountBDesiredDecimal}, Available: ${balanceBData.formatted}`
      );
    }

    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const to = walletAddress; // Receiver of the LP tokens

    // Ensure allowances
    if (
      tokenAAddress !== ZeroAddress &&
      tokenAAddress.toLowerCase() !==
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      const allowanceAOK = await this.ensureTokenAllowance(
        walletAddress,
        tokenAAddress,
        DEX_CONFIG.ROUTER_V2,
        amountADesiredWei
      );
      if (!allowanceAOK) {
        console.error(
          `Allowance check failed for token A (${tokenAInfo.symbol})`
        );
        return null;
      }
    }
    if (
      tokenBAddress !== ZeroAddress &&
      tokenBAddress.toLowerCase() !==
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      const allowanceBOK = await this.ensureTokenAllowance(
        walletAddress,
        tokenBAddress,
        DEX_CONFIG.ROUTER_V2,
        amountBDesiredWei
      );
      if (!allowanceBOK) {
        console.error(
          `Allowance check failed for token B (${tokenBInfo.symbol})`
        );
        return null;
      }
    }

    console.log("Adding liquidity with params:", {
      tokenA: tokenAAddress,
      tokenB: tokenBAddress,
      amountADesired: amountADesiredWei.toString(),
      amountBDesired: amountBDesiredWei.toString(),
      amountAMin: amountAMinWei.toString(),
      amountBMin: amountBMinWei.toString(),
      to,
      deadline,
    });

    let tx;
    const gasOptions = await this.getGasOptions(BigInt(300000)); // Slightly higher base for add liquidity

    try {
      if (
        tokenAAddress === ZeroAddress ||
        tokenAAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        // Adding liquidity with ETH and TokenB
        console.log("Executing addLiquidityETH for TokenB:", tokenBAddress);
        tx = await routerWithSigner.addLiquidityETH(
          tokenBAddress, // token address
          amountBDesiredWei, // amountTokenDesired
          amountBMinWei, // amountTokenMin
          amountAMinWei, // amountETHMin (amountADesiredWei is ETH value)
          to,
          deadline,
          { ...gasOptions, value: amountADesiredWei } // ETH value passed here
        );
      } else if (
        tokenBAddress === ZeroAddress ||
        tokenBAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        // Adding liquidity with ETH and TokenA
        console.log("Executing addLiquidityETH for TokenA:", tokenAAddress);
        tx = await routerWithSigner.addLiquidityETH(
          tokenAAddress, // token address
          amountADesiredWei, // amountTokenDesired
          amountAMinWei, // amountTokenMin
          amountBMinWei, // amountETHMin (amountBDesiredWei is ETH value)
          to,
          deadline,
          { ...gasOptions, value: amountBDesiredWei } // ETH value passed here
        );
      } else {
        // Adding liquidity with two ERC20 tokens
        console.log(
          "Executing addLiquidity for TokenA/TokenB:",
          tokenAAddress,
          tokenBAddress
        );
        tx = await routerWithSigner.addLiquidity(
          tokenAAddress,
          tokenBAddress,
          amountADesiredWei,
          amountBDesiredWei,
          amountAMinWei,
          amountBMinWei,
          to,
          deadline,
          gasOptions
        );
      }
      console.log("Add liquidity transaction sent:", tx.hash);
      return tx.hash;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in addLiquidity:", error.message);
        const errorData = (error as any).data;
        if (errorData) {
          try {
            const decodedError = this.routerContract?.interface.parseError(
              (error as any).data
            );
            console.error(
              "Decoded revert reason:",
              decodedError?.name,
              decodedError?.args
            );
          } catch (e) {
            console.error("Could not decode revert reason from error.data");
          }
        }
      } else {
        console.error("Unknown error type:", error);
      }
      throw new Error(
        `Transaction failed: ${(error as any)?.message || "Unknown error"}`
      );
    }
  }

  async removeLiquidity(
    walletAddress: string,
    tokenAAddress: string,
    tokenBAddress: string,
    liquidityDecimal: string, // Amount of LP tokens to remove
    amountAMinDecimal: string,
    amountBMinDecimal: string,
    deadlineMinutes: number = 20
  ): Promise<string | null> {
    if (!this.provider || !this.routerContract) {
      console.error(
        "Provider or router contract not initialized for removeLiquidity."
      );
      return null;
    }
    const signer = await this.provider.getSigner(walletAddress);
    const routerWithSigner = this.routerContract.connect(signer) as Contract;

    const tokenAInfo = this.getTokenInfoByAddress(tokenAAddress);
    const tokenBInfo = this.getTokenInfoByAddress(tokenBAddress);
    if (!tokenAInfo || !tokenBInfo) {
      console.error("Token info not found for removeLiquidity.");
      return null;
    }

    // LP token decimals are usually 18
    const lpTokenDecimals = 18;
    const liquidityWei = DexService.parseDecimalToWeiBigInt(
      liquidityDecimal,
      lpTokenDecimals
    );
    const amountAMinWei = DexService.parseDecimalToWeiBigInt(
      amountAMinDecimal,
      tokenAInfo.decimals
    );
    const amountBMinWei = DexService.parseDecimalToWeiBigInt(
      amountBMinDecimal,
      tokenBInfo.decimals
    );

    if (liquidityWei <= BigInt(0)) {
      console.error("Liquidity amount to remove must be greater than zero.");
      return null;
    }

    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;
    const to = walletAddress;

    // Get pair address and ensure allowance for LP tokens
    const pairAddress = await this.getPairAddress(tokenAAddress, tokenBAddress);
    if (!pairAddress || pairAddress === ZeroAddress) {
      console.error("Could not find pair address for LP tokens.");
      return null;
    }
    const allowanceOK = await this.ensureTokenAllowance(
      walletAddress,
      pairAddress,
      DEX_CONFIG.ROUTER_V2,
      liquidityWei
    );
    if (!allowanceOK) {
      console.error("LP token allowance not granted or failed.");
      return null;
    }

    console.log("Removing liquidity with params:", {
      tokenA: tokenAAddress,
      tokenB: tokenBAddress,
      liquidity: liquidityWei.toString(),
      amountAMin: amountAMinWei.toString(),
      amountBMin: amountBMinWei.toString(),
      to,
      deadline,
    });

    let tx;
    const gasOptions = await this.getGasOptions();

    try {
      if (
        tokenAAddress === ZeroAddress ||
        tokenAAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase() ||
        tokenBAddress === ZeroAddress ||
        tokenBAddress.toLowerCase() ===
          DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        // Removing liquidity involving ETH
        const tokenAddress =
          tokenAAddress === ZeroAddress ||
          tokenAAddress.toLowerCase() ===
            DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
            ? tokenBAddress
            : tokenAAddress;
        const amountTokenMin =
          tokenAAddress === ZeroAddress ||
          tokenAAddress.toLowerCase() ===
            DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
            ? amountBMinWei
            : amountAMinWei;
        const amountETHMin =
          tokenAAddress === ZeroAddress ||
          tokenAAddress.toLowerCase() ===
            DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
            ? amountAMinWei
            : amountBMinWei;

        console.log("Executing removeLiquidityETH...");
        tx = await routerWithSigner.removeLiquidityETH(
          tokenAddress,
          liquidityWei,
          amountTokenMin,
          amountETHMin,
          to,
          deadline,
          gasOptions
        );
      } else {
        // Removing liquidity for two ERC20 tokens
        console.log("Executing removeLiquidity...");
        tx = await routerWithSigner.removeLiquidity(
          tokenAAddress,
          tokenBAddress,
          liquidityWei,
          amountAMinWei,
          amountBMinWei,
          to,
          deadline,
          gasOptions
        );
      }
      console.log("Remove liquidity transaction sent:", tx.hash);
      return tx.hash;
    } catch (error: any) {
      console.error("Error removing liquidity:", error);
      if (error.data) {
        try {
          const decodedError = this.routerContract.interface.parseError(
            error.data
          );
          console.error(
            "Decoded revert reason:",
            decodedError?.name,
            decodedError?.args
          );
        } catch (e) {
          console.error("Could not decode revert reason from error.data");
        }
      }
      return null;
    }
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<any | null> {
    if (!this.provider) {
      console.error("Provider not available for waitForTransaction.");
      return null;
    }
    try {
      console.log(`Waiting for transaction ${txHash} to be confirmed...`);
      const receipt = await this.provider.waitForTransaction(
        txHash,
        confirmations
      );
      console.log("Transaction confirmed:", receipt);
      if (receipt && receipt.status === 0) {
        console.error(`Transaction ${txHash} failed with status 0x0.`, receipt);
        // Attempt to get revert reason if not already available
        const tx = await this.provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          try {
            const code = await this.provider.call({
              to: tx.to,
              data: tx.data,
              value: tx.value,
            });
            const reason = this.decodeRevertReason(code);
            console.error(
              "Revert reason:",
              reason || "Not available or not a standard revert."
            );
            throw new Error(`Transaction failed: ${reason || "Status 0x0"}`);
          } catch (callError) {
            console.error("Could not get revert reason:", callError);
            throw new Error("Transaction failed with status 0x0");
          }
        }
        throw new Error("Transaction failed with status 0x0");
      }
      return receipt;
    } catch (error) {
      console.error(`Error waiting for transaction ${txHash}:`, error);
      throw error; // Re-throw to be caught by caller
    }
  }

  private decodeRevertReason(hexString: string): string | null {
    if (!hexString || hexString === "0x")
      return "No revert reason (successful or not a standard revert).";
    const iface = new Interface(["function Error(string)"]);
    try {
      const decoded = iface.decodeFunctionData("Error", hexString);
      return decoded[0];
    } catch (e) {
      // Not a standard string revert, try common ABI-encoded errors if known
      // For example, from OpenZeppelin's Ownable: new Interface(["error OwnableUnauthorizedAccount(address account)"])
      // Or from a custom contract: new Interface(["error MyCustomError(uint256 code)"])
      // This part would need to be extended based on common errors in your contracts
      try {
        return (
          AbiCoder.defaultAbiCoder().decode(
            ["string"],
            hexString.startsWith("0x08c379a0")
              ? hexString.substring(10)
              : hexString
          )?.[0] || "Could not decode revert reason."
        );
      } catch (abiError) {
        console.warn("Failed to decode revert reason with AbiCoder:", abiError);
        return "Could not decode revert reason (non-standard format).";
      }
    }
  }

  // Helper to get token decimals
  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    if (
      tokenAddress === ZeroAddress ||
      tokenAddress.toLowerCase() ===
        DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      return DEX_CONFIG.NATIVE_TOKEN.decimals;
    }
    const knownToken = EXAMPLE_TOKEN_LIST.tokens.find(
      (t) => t.address.toLowerCase() === tokenAddress.toLowerCase()
    );
    if (knownToken) return knownToken.decimals;

    if (!this.provider) {
      console.warn(
        "Provider not available for getTokenDecimals, defaulting to 18."
      );
      return 18; // Default fallback
    }
    try {
      const tokenContract = new Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );
      const decimals = await tokenContract.decimals();
      return Number(decimals);
    } catch (error) {
      console.error(
        `Error fetching decimals for ${tokenAddress}, defaulting to 18:`,
        error
      );
      return 18; // Default fallback
    }
  }

  public getTokenInfoByAddress(address: string): TokenInfo | undefined {
    if (
      address === ZeroAddress ||
      address.toLowerCase() === DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
    ) {
      return {
        chainId: DEX_CONFIG.CHAIN_ID,
        address: DEX_CONFIG.NATIVE_TOKEN.address,
        symbol: DEX_CONFIG.NATIVE_TOKEN.symbol,
        name: DEX_CONFIG.NATIVE_TOKEN.name,
        decimals: DEX_CONFIG.NATIVE_TOKEN.decimals,
        logoURI: "", // Add if available
      };
    }

    // Try to find in known token list first
    const knownToken = EXAMPLE_TOKEN_LIST.tokens.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    if (knownToken) {
      return knownToken;
    }

    // If not found, create a basic token info structure
    // In a production app, you might fetch this from the blockchain
    return {
      chainId: DEX_CONFIG.CHAIN_ID,
      address: address,
      symbol: `TOKEN_${address.slice(2, 8).toUpperCase()}`,
      name: `Unknown Token ${address.slice(2, 8)}`,
      decimals: 18, // Default to 18 decimals
      logoURI: "",
    };
  }

  private async getGasOptions(baseGasLimit?: bigint): Promise<{
    gasLimit: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }> {
    if (!this.provider) {
      console.warn("Provider not available for getGasOptions. Using defaults.");
      return { gasLimit: baseGasLimit || BigInt(210000) }; // Default gas limit
    }
    try {
      const feeData = await this.provider.getFeeData();
      const gasLimit = baseGasLimit
        ? BigInt(
            Math.floor(Number(baseGasLimit) * DEX_CONFIG.GAS_LIMIT_MULTIPLIER)
          )
        : BigInt(210000); // Default or adjusted base

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        return {
          gasLimit: gasLimit,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        };
      } else if (feeData.gasPrice) {
        // Fallback for non-EIP-1559 networks
        return {
          gasLimit: gasLimit,
          // gasPrice: feeData.gasPrice // This would be used if the transaction type supports it
        };
      }
      return { gasLimit: gasLimit }; // Fallback if no fee data
    } catch (error) {
      console.error(
        "Error fetching fee data, using default gas options:",
        error
      );
      return { gasLimit: baseGasLimit || BigInt(210000) };
    }
  }

  async getPairAddress(
    tokenAAddress: string,
    tokenBAddress: string
  ): Promise<string | null> {
    if (!this.factoryContract) {
      console.error("Factory contract not initialized in getPairAddress.");
      return null;
    }
    try {
      // Ensure consistent ordering for pair address calculation
      const [token0, token1] =
        tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()
          ? [tokenAAddress, tokenBAddress]
          : [tokenBAddress, tokenAAddress];
      const pairAddress = await this.factoryContract.getPair(token0, token1);
      return pairAddress;
    } catch (error) {
      console.error("Error getting pair address:", error);
      return null;
    }
  }

  async getLiquidityTokenBalance(
    walletAddress: string,
    tokenAAddress: string,
    tokenBAddress: string
  ): Promise<{ wei: bigint; formatted: string; pairAddress: string | null }> {
    if (!this.provider || !this.factoryContract) {
      console.error(
        "Provider or factory contract not initialized for getLiquidityTokenBalance."
      );
      return { wei: BigInt(0), formatted: "0.0", pairAddress: null };
    }
    const pairAddress = await this.getPairAddress(tokenAAddress, tokenBAddress);
    if (!pairAddress || pairAddress === ZeroAddress) {
      console.log("LP token pair address not found or is zero address.");
      return { wei: BigInt(0), formatted: "0.0", pairAddress: null };
    }

    try {
      const pairContract = new Contract(pairAddress, PAIR_ABI, this.provider);
      const balanceWei: bigint = await pairContract.balanceOf(walletAddress);
      // LP tokens typically have 18 decimals
      const formattedBalance = DexService.formatWeiToDecimal(balanceWei, 18);
      console.log(
        `LP token balance for ${pairAddress} by ${walletAddress}: ${formattedBalance} (${balanceWei} wei)`
      );
      return { wei: balanceWei, formatted: formattedBalance, pairAddress };
    } catch (error) {
      console.error(
        `Error fetching LP token balance for pair ${pairAddress}:`,
        error
      );
      return { wei: BigInt(0), formatted: "0.0", pairAddress };
    }
  }

  // Fetch all liquidity pools and user's LP token balances
  async fetchLiquidityPools(walletAddress?: string): Promise<LiquidityPool[]> {
    if (!this.provider || !this.factoryContract) {
      console.error(
        "Provider or factory contract not initialized for fetchLiquidityPools."
      );
      return [];
    }

    try {
      console.log("Fetching liquidity pools...");

      // Get total number of pairs from factory
      const pairCount = await this.factoryContract.allPairsLength();
      console.log(`Total pairs in factory: ${pairCount.toString()}`);

      const pools: LiquidityPool[] = [];
      const maxPairsToCheck = Math.min(Number(pairCount), 50); // Limit for performance

      for (let i = 0; i < maxPairsToCheck; i++) {
        try {
          // Get pair address
          const pairAddress = await this.factoryContract.allPairs(i);

          if (pairAddress === ZeroAddress) continue;

          // Get pair contract
          const pairContract = new Contract(
            pairAddress,
            PAIR_ABI,
            this.provider
          );

          // Get token addresses
          const [token0Address, token1Address, reserves, totalSupply] =
            await Promise.all([
              pairContract.token0(),
              pairContract.token1(),
              pairContract.getReserves(),
              pairContract.totalSupply(),
            ]);

          // Get token info
          const token0Info = this.getTokenInfoByAddress(token0Address);
          const token1Info = this.getTokenInfoByAddress(token1Address);

          if (!token0Info || !token1Info) {
            continue; // Skip if we don't have token info
          }

          // Format reserves
          const reserve0Formatted = DexService.formatWeiToDecimal(
            reserves[0],
            token0Info.decimals
          );
          const reserve1Formatted = DexService.formatWeiToDecimal(
            reserves[1],
            token1Info.decimals
          );
          const totalSupplyFormatted = DexService.formatWeiToDecimal(
            totalSupply,
            18
          );

          // Get user's LP token balance if wallet is connected
          let lpTokenBalance = "0";
          if (walletAddress) {
            try {
              const userBalance = await pairContract.balanceOf(walletAddress);
              lpTokenBalance = DexService.formatWeiToDecimal(userBalance, 18);
            } catch (error) {
              console.error(
                `Error fetching LP balance for ${pairAddress}:`,
                error
              );
            }
          }

          // Calculate APY (placeholder - would need price feeds for accurate calculation)
          const apy = Math.random() * 100; // Placeholder APY

          const pool: LiquidityPool = {
            id: pairAddress,
            tokenA: token0Info,
            tokenB: token1Info,
            reserveA: reserve0Formatted,
            reserveB: reserve1Formatted,
            totalSupply: totalSupplyFormatted,
            lpTokenBalance,
            apy,
          };

          // Only include pools with reserves > 0 or user has LP tokens
          if (
            parseFloat(reserve0Formatted) > 0 ||
            parseFloat(reserve1Formatted) > 0 ||
            parseFloat(lpTokenBalance) > 0
          ) {
            pools.push(pool);
          }
        } catch (error) {
          console.error(`Error processing pair ${i}:`, error);
          continue;
        }
      }

      console.log(`Fetched ${pools.length} liquidity pools`);
      return pools;
    } catch (error) {
      console.error("Error fetching liquidity pools:", error);
      return [];
    }
  }

  // Add any other methods that were previously defined and are still needed.
  // e.g., decodeAmountsOut, encodePath, etc. if they are used by other parts of the application.

  public decodeAmountsOut(amountsOutEncoded: string): bigint[] {
    try {
      const decoded = AbiCoder.defaultAbiCoder().decode(
        ["uint256[]"],
        amountsOutEncoded
      );
      if (decoded && decoded[0] && Array.isArray(decoded[0])) {
        return decoded[0].map((amount: any) => BigInt(amount.toString()));
      }
      return [];
    } catch (error) {
      console.error("Error decoding amounts out:", error);
      return [];
    }
  }

  public encodePath(path: string[], fees: number[]): string {
    // This is a simplified example. Uniswap V3 path encoding is more complex.
    // For V2, path is just an array of addresses. This method might be for V3 or custom router.
    if (path.length - 1 !== fees.length && fees.length > 0) {
      // fees can be empty for simple V2 paths
      throw new Error("Path/fee mismatch for encoding");
    }
    let encoded = "0x" + path[0].slice(2);
    for (let i = 0; i < fees.length; i++) {
      encoded += fees[i].toString(16).padStart(6, "0") + path[i + 1].slice(2);
    }
    return encoded;
  }

  // Get pool reserves for calculating liquidity ratios
  async getPoolReserves(
    tokenAAddress: string,
    tokenBAddress: string
  ): Promise<{
    reserve0: string;
    reserve1: string;
    token0: string;
    token1: string;
    pairAddress: string | null;
  } | null> {
    try {
      if (!this.provider || !this.factoryContract) {
        console.error("Provider or factory contract not initialized");
        return null;
      }

      // Convert native token addresses to WETH/WBCT for pool lookup
      let actualTokenA = tokenAAddress;
      let actualTokenB = tokenBAddress;

      // Convert BCT (native) to WBCT for pool operations
      if (
        tokenAAddress === ZeroAddress ||
        tokenAAddress.toLowerCase() === DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        actualTokenA = DEX_CONFIG.WETH; // WBCT address
      }
      if (
        tokenBAddress === ZeroAddress ||
        tokenBAddress.toLowerCase() === DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        actualTokenB = DEX_CONFIG.WETH; // WBCT address
      }

      console.log(`Looking for pool: ${actualTokenA} / ${actualTokenB}`);

      // Get pair address using the existing factory contract
      const pairAddress = await this.factoryContract.getPair(
        actualTokenA,
        actualTokenB
      );

      if (
        pairAddress === ZeroAddress ||
        pairAddress === "0x0000000000000000000000000000000000000000"
      ) {
        console.log("Pool does not exist for this token pair");
        return null;
      }

      // Get pair contract
      const pairContract = new Contract(pairAddress, PAIR_ABI, this.provider);

      // Get reserves and token order
      const [reserve0, reserve1] = await pairContract.getReserves();
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();

      // Check if reserves are valid (greater than 0)
      if (
        BigInt(reserve0.toString()) === BigInt(0) &&
        BigInt(reserve1.toString()) === BigInt(0)
      ) {
        console.log("Pool exists but has no liquidity");
        return null;
      }

      return {
        reserve0: reserve0.toString(),
        reserve1: reserve1.toString(),
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        pairAddress,
      };
    } catch (error: any) {
      console.error("Error getting pool reserves:", error);
      // Distinguish between pool not existing and other errors
      if (
        error?.message?.includes("execution reverted") ||
        error?.code === "CALL_EXCEPTION"
      ) {
        console.log("Pool likely does not exist or has no liquidity");
        return null;
      }
      // For other errors (network issues, etc.), we should handle them differently
      throw error;
    }
  }

  // Calculate required token amount based on pool ratio
  async calculateLiquidityRatio(
    inputTokenAddress: string,
    outputTokenAddress: string,
    inputAmount: string,
    inputTokenDecimals: number,
    outputTokenDecimals: number
  ): Promise<string | null> {
    try {
      // Convert native token addresses to WETH/WBCT for pool lookup
      let actualInputTokenAddress = inputTokenAddress;
      let actualOutputTokenAddress = outputTokenAddress;

      // Convert BCT (native) to WBCT for pool operations
      if (
        inputTokenAddress === ZeroAddress ||
        inputTokenAddress.toLowerCase() === DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        actualInputTokenAddress = DEX_CONFIG.WETH; // WBCT address
      }
      if (
        outputTokenAddress === ZeroAddress ||
        outputTokenAddress.toLowerCase() === DEX_CONFIG.NATIVE_TOKEN.address.toLowerCase()
      ) {
        actualOutputTokenAddress = DEX_CONFIG.WETH; // WBCT address
      }

      const poolData = await this.getPoolReserves(
        actualInputTokenAddress,
        actualOutputTokenAddress
      );

      if (!poolData) {
        return null; // Pool doesn't exist
      }

      // Determine which token is token0 and which is token1 (using actual addresses)
      const isInputToken0 = actualInputTokenAddress.toLowerCase() === poolData.token0;

      const inputReserve = isInputToken0
        ? poolData.reserve0
        : poolData.reserve1;
      const outputReserve = isInputToken0
        ? poolData.reserve1
        : poolData.reserve0;

      // Convert input amount to wei
      const inputAmountWei = DexService.parseDecimalToWeiBigInt(
        inputAmount,
        inputTokenDecimals
      );

      // Calculate output amount using the pool ratio: outputAmount = (inputAmount * outputReserve) / inputReserve
      const outputAmountWei =
        (inputAmountWei * BigInt(outputReserve)) / BigInt(inputReserve);

      // Convert back to decimal
      const outputAmount = DexService.formatWeiToDecimal(
        outputAmountWei,
        outputTokenDecimals
      );

      return outputAmount;
    } catch (error) {
      console.error("Error calculating liquidity ratio:", error);
      return null;
    }
  }

  // Debug method to investigate LP token details
  async debugLPToken(lpTokenAddress: string): Promise<any> {
    if (!this.provider) {
      console.error("Provider not initialized for debugLPToken");
      return null;
    }

    try {
      console.log(`🔍 Debugging LP token: ${lpTokenAddress}`);

      // Create pair contract instance
      const pairContract = new Contract(
        lpTokenAddress,
        PAIR_ABI,
        this.provider
      );

      // Get token addresses from the LP token
      const [token0Address, token1Address, reserves, totalSupply] =
        await Promise.all([
          pairContract.token0(),
          pairContract.token1(),
          pairContract.getReserves(),
          pairContract.totalSupply(),
        ]);

      console.log(`Token0: ${token0Address}`);
      console.log(`Token1: ${token1Address}`);
      console.log(`Reserves:`, reserves);
      console.log(`Total Supply:`, totalSupply.toString());

      // Get token info
      const token0Info = this.getTokenInfoByAddress(token0Address);
      const token1Info = this.getTokenInfoByAddress(token1Address);

      console.log(`Token0 Info:`, token0Info);
      console.log(`Token1 Info:`, token1Info);

      // Check if factory recognizes this pair
      if (this.factoryContract) {
        const factoryPairAddress = await this.factoryContract.getPair(
          token0Address,
          token1Address
        );
        console.log(`Factory returns pair address: ${factoryPairAddress}`);
        console.log(`LP token address: ${lpTokenAddress}`);
        console.log(
          `Addresses match: ${
            factoryPairAddress.toLowerCase() === lpTokenAddress.toLowerCase()
          }`
        );
      }

      // Format reserves
      const reserve0Formatted = DexService.formatWeiToDecimal(
        reserves[0],
        token0Info?.decimals || 18
      );
      const reserve1Formatted = DexService.formatWeiToDecimal(
        reserves[1],
        token1Info?.decimals || 18
      );

      return {
        lpTokenAddress,
        token0Address,
        token1Address,
        token0Info,
        token1Info,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        reserve0Formatted,
        reserve1Formatted,
        totalSupply: totalSupply.toString(),
        factoryPairAddress: this.factoryContract
          ? await this.factoryContract.getPair(token0Address, token1Address)
          : "Factory not available",
      };
    } catch (error) {
      console.error(`Error debugging LP token ${lpTokenAddress}:`, error);
      return { error: error.message };
    }
  }
}

// Initialize with undefined provider. It should be set by the application context later.
export const dexService = new DexService(undefined); // Constructor will call init(undefined)

export const initializeDexService = (provider: BrowserProvider) => {
  console.log("initializeDexService: Calling dexService.init() with provider.");
  dexService.init(provider); // Use the init method of the global dexService instance
};
