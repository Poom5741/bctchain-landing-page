// Production DEX service for interacting with BCTChain smart contracts
import { DEX_CONFIG, TokenInfo, TokenListService } from "./token-list";

// Define types for Web3 functionality
interface EthereumProvider {
  request: (params: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

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
  private web3Provider: any = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        this.web3Provider = window.ethereum;
      }
    } catch (error) {
      console.error("Failed to initialize provider:", error);
    }
  }

  async connectWallet(): Promise<string[]> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "No wallet detected. Please install MetaMask or another Web3 wallet."
      );
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      await this.switchToCorrectChain();
      this.web3Provider = window.ethereum;
      return accounts;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  private async switchToCorrectChain() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No wallet provider available");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${DEX_CONFIG.CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${DEX_CONFIG.CHAIN_ID.toString(16)}`,
              chainName: DEX_CONFIG.CHAIN_NAME,
              rpcUrls: [DEX_CONFIG.RPC_URL],
              blockExplorerUrls: [DEX_CONFIG.EXPLORER_URL],
              nativeCurrency: {
                name: DEX_CONFIG.NATIVE_TOKEN.name,
                symbol: DEX_CONFIG.NATIVE_TOKEN.symbol,
                decimals: DEX_CONFIG.NATIVE_TOKEN.decimals,
              },
            },
          ],
        });
      }
    }
  }

  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<string> {
    if (!this.web3Provider) return "0";

    try {
      if (
        tokenAddress === DEX_CONFIG.NATIVE_TOKEN.address ||
        tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        const balance = await this.web3Provider.request({
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        });
        return (parseInt(balance, 16) / Math.pow(10, 18)).toString();
      }

      // For ERC20 tokens, use actual contract call
      const balanceData = this.encodeTokenBalance(walletAddress);
      const result = await this.web3Provider.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: balanceData,
          },
          "latest",
        ],
      });

      const balance = parseInt(result, 16);
      return (balance / Math.pow(10, 18)).toString(); // Assuming 18 decimals
    } catch (error) {
      console.error("Failed to get token balance:", error);
      return "0";
    }
  }

  async getSwapQuote(params: SwapParams): Promise<SwapQuote | null> {
    if (!this.web3Provider) {
      console.error("No web3 provider available");
      return null;
    }

    try {
      const { inputToken, outputToken, inputAmount, slippageTolerance } =
        params;
      const inputValue = parseFloat(inputAmount);

      if (inputValue <= 0) {
        console.error("Invalid input amount");
        return null;
      }

      const inputAmountWei = `0x${Math.floor(
        inputValue * Math.pow(10, inputToken.decimals)
      ).toString(16)}`;
      const path = this.buildSwapPath(inputToken, outputToken);

      if (path.length === 0) {
        console.error("No valid swap path found");
        return null;
      }

      const getAmountsOutData = this.encodeGetAmountsOut(inputAmountWei, path);
      const result = await this.web3Provider.request({
        method: "eth_call",
        params: [
          {
            to: DEX_CONFIG.ROUTER_V2,
            data: getAmountsOutData,
          },
          "latest",
        ],
      });

      const amounts = this.decodeAmountsOut(result);
      if (!amounts || amounts.length < 2) {
        console.error("Invalid amounts returned from router");
        return null;
      }

      const outputAmountWei = amounts[amounts.length - 1];
      const outputAmount = (
        outputAmountWei / Math.pow(10, outputToken.decimals)
      ).toString();
      const priceImpact = this.calculatePriceImpact(
        inputValue,
        parseFloat(outputAmount)
      );
      const slippageMultiplier = (10000 - slippageTolerance) / 10000;
      const minimumReceived = (
        parseFloat(outputAmount) * slippageMultiplier
      ).toFixed(6);

      return {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: parseFloat(outputAmount).toFixed(6),
        priceImpact,
        fee: 0.3,
        route: path,
        gasEstimate: "200000",
        minimumReceived,
        expiresAt: Date.now() + 60000,
      };
    } catch (error: any) {
      console.error("Failed to get swap quote:", error);
      return null;
    }
  }

  async executeSwap(params: SwapParams): Promise<string> {
    if (!this.web3Provider) {
      throw new Error("Wallet not connected");
    }

    const {
      inputToken,
      outputToken,
      inputAmount,
      slippageTolerance,
      recipient,
      deadline,
    } = params;

    try {
      const accounts = await this.web3Provider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet address found");
      }

      const userAddress = recipient || accounts[0];
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200;

      const quote = await this.getSwapQuote(params);
      if (!quote) {
        throw new Error("Unable to get swap quote");
      }

      const minimumOutput = quote.minimumReceived;
      const inputAmountWei = `0x${Math.floor(
        parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)
      ).toString(16)}`;
      const minimumOutputWei = `0x${Math.floor(
        parseFloat(minimumOutput) * Math.pow(10, outputToken.decimals)
      ).toString(16)}`;
      const deadlineHex = `0x${swapDeadline.toString(16)}`;

      const isNativeInput =
        inputToken.address === "0x0000000000000000000000000000000000000000";
      const isNativeOutput =
        outputToken.address === "0x0000000000000000000000000000000000000000";

      let txParams: any = {
        from: userAddress,
        to: DEX_CONFIG.ROUTER_V2,
        gas: "0x61A80",
      };

      if (isNativeInput && !isNativeOutput) {
        const data = this.encodeSwapExactETHForTokens(
          minimumOutputWei,
          [DEX_CONFIG.WETH, outputToken.address],
          userAddress,
          deadlineHex
        );
        txParams.data = data;
        txParams.value = inputAmountWei;
      } else if (!isNativeInput && isNativeOutput) {
        await this.ensureTokenAllowance(
          inputToken.address,
          userAddress,
          inputAmountWei
        );
        const data = this.encodeSwapExactTokensForETH(
          inputAmountWei,
          minimumOutputWei,
          [inputToken.address, DEX_CONFIG.WETH],
          userAddress,
          deadlineHex
        );
        txParams.data = data;
      } else if (!isNativeInput && !isNativeOutput) {
        await this.ensureTokenAllowance(
          inputToken.address,
          userAddress,
          inputAmountWei
        );
        const data = this.encodeSwapExactTokensForTokens(
          inputAmountWei,
          minimumOutputWei,
          [inputToken.address, outputToken.address],
          userAddress,
          deadlineHex
        );
        txParams.data = data;
      } else {
        throw new Error("Cannot swap BCT for BCT");
      }

      const txHash = await this.web3Provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Transaction sent:", txHash);
      return txHash;
    } catch (error) {
      console.error("Failed to execute swap:", error);
      throw error;
    }
  }

  async addLiquidity(params: AddLiquidityParams): Promise<string> {
    if (!this.web3Provider) {
      throw new Error("Wallet not connected");
    }

    const {
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      slippageTolerance,
      recipient,
      deadline,
    } = params;

    try {
      const accounts = await this.web3Provider.request({
        method: "eth_requestAccounts",
      });

      const userAddress = recipient || accounts[0];
      const liquidityDeadline =
        deadline || Math.floor(Date.now() / 1000) + 1200;

      const amountADesiredWei = `0x${Math.floor(
        parseFloat(amountADesired) * Math.pow(10, tokenA.decimals)
      ).toString(16)}`;
      const amountBDesiredWei = `0x${Math.floor(
        parseFloat(amountBDesired) * Math.pow(10, tokenB.decimals)
      ).toString(16)}`;
      const amountAMinWei = `0x${Math.floor(
        parseFloat(amountADesired) *
          Math.pow(10, tokenA.decimals) *
          (1 - slippageTolerance / 10000)
      ).toString(16)}`;
      const amountBMinWei = `0x${Math.floor(
        parseFloat(amountBDesired) *
          Math.pow(10, tokenB.decimals) *
          (1 - slippageTolerance / 10000)
      ).toString(16)}`;
      const deadlineHex = `0x${liquidityDeadline.toString(16)}`;

      const isTokenANative =
        tokenA.address === "0x0000000000000000000000000000000000000000";
      const isTokenBNative =
        tokenB.address === "0x0000000000000000000000000000000000000000";

      let txParams: any = {
        from: userAddress,
        to: DEX_CONFIG.ROUTER_V2,
        gas: "0x61A80",
      };

      if (isTokenANative || isTokenBNative) {
        const token = isTokenANative ? tokenB : tokenA;
        const tokenAmount = isTokenANative
          ? amountBDesiredWei
          : amountADesiredWei;
        const tokenAmountMin = isTokenANative ? amountBMinWei : amountAMinWei;
        const ethAmount = isTokenANative
          ? amountADesiredWei
          : amountBDesiredWei;
        const ethAmountMin = isTokenANative ? amountAMinWei : amountBMinWei;

        await this.ensureTokenAllowance(
          token.address,
          userAddress,
          tokenAmount
        );

        const data = this.encodeAddLiquidityETH(
          token.address,
          tokenAmount,
          tokenAmountMin,
          ethAmountMin,
          userAddress,
          deadlineHex
        );

        txParams.data = data;
        txParams.value = ethAmount;
      } else {
        await this.ensureTokenAllowance(
          tokenA.address,
          userAddress,
          amountADesiredWei
        );
        await this.ensureTokenAllowance(
          tokenB.address,
          userAddress,
          amountBDesiredWei
        );

        const data = this.encodeAddLiquidity(
          tokenA.address,
          tokenB.address,
          amountADesiredWei,
          amountBDesiredWei,
          amountAMinWei,
          amountBMinWei,
          userAddress,
          deadlineHex
        );

        txParams.data = data;
      }

      const txHash = await this.web3Provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Add liquidity transaction sent:", txHash);
      return txHash;
    } catch (error) {
      console.error("Failed to add liquidity:", error);
      throw error;
    }
  }

  async removeLiquidity(params: RemoveLiquidityParams): Promise<string> {
    if (!this.web3Provider) {
      throw new Error("Wallet not connected");
    }

    const {
      tokenA,
      tokenB,
      liquidity,
      slippageTolerance,
      recipient,
      deadline,
    } = params;

    try {
      const accounts = await this.web3Provider.request({
        method: "eth_requestAccounts",
      });

      const userAddress = recipient || accounts[0];
      const liquidityDeadline =
        deadline || Math.floor(Date.now() / 1000) + 1200;
      const liquidityWei = `0x${Math.floor(
        parseFloat(liquidity) * Math.pow(10, 18)
      ).toString(16)}`;
      const amountAMinWei = "0x0";
      const amountBMinWei = "0x0";
      const deadlineHex = `0x${liquidityDeadline.toString(16)}`;

      const isTokenANative =
        tokenA.address === "0x0000000000000000000000000000000000000000";
      const isTokenBNative =
        tokenB.address === "0x0000000000000000000000000000000000000000";

      let txParams: any = {
        from: userAddress,
        to: DEX_CONFIG.ROUTER_V2,
        gas: "0x61A80",
      };

      if (isTokenANative || isTokenBNative) {
        const token = isTokenANative ? tokenB : tokenA;
        const data = this.encodeRemoveLiquidityETH(
          token.address,
          liquidityWei,
          amountAMinWei,
          amountBMinWei,
          userAddress,
          deadlineHex
        );
        txParams.data = data;
      } else {
        const data = this.encodeRemoveLiquidity(
          tokenA.address,
          tokenB.address,
          liquidityWei,
          amountAMinWei,
          amountBMinWei,
          userAddress,
          deadlineHex
        );
        txParams.data = data;
      }

      const txHash = await this.web3Provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      console.log("Remove liquidity transaction sent:", txHash);
      return txHash;
    } catch (error) {
      console.error("Failed to remove liquidity:", error);
      throw error;
    }
  }

  // New methods for real data functionality
  async fetchLiquidityPools(): Promise<LiquidityPool[]> {
    console.log(
      "fetchLiquidityPools called - returning empty array (implement when contracts are deployed)"
    );
    return [];
  }

  async getUserTokenBalances(
    userAddress: string
  ): Promise<Map<string, string>> {
    const balances = new Map<string, string>();

    if (!this.web3Provider) {
      console.error("No web3 provider available");
      return balances;
    }

    try {
      const tokenList = await TokenListService.fetchTokenList();

      const nativeBalance = await this.web3Provider.request({
        method: "eth_getBalance",
        params: [userAddress, "latest"],
      });

      const nativeBalanceDecimal = (
        parseInt(nativeBalance, 16) / Math.pow(10, 18)
      ).toString();
      balances.set(
        "0x0000000000000000000000000000000000000000",
        nativeBalanceDecimal
      );

      for (const token of tokenList.tokens) {
        if (token.address !== "0x0000000000000000000000000000000000000000") {
          try {
            const balance = await this.getTokenBalance(
              token.address,
              userAddress
            );
            balances.set(token.address, balance);
          } catch (error) {
            console.error(`Failed to get balance for ${token.symbol}:`, error);
            balances.set(token.address, "0");
          }
        }
      }

      return balances;
    } catch (error) {
      console.error("Failed to fetch user token balances:", error);
      return balances;
    }
  }

  async getUserLiquidityPositions(
    userAddress: string
  ): Promise<LiquidityPool[]> {
    console.log(
      "getUserLiquidityPositions called - returning empty array (implement when contracts are deployed)"
    );
    return [];
  }

  async waitForTransaction(txHash: string): Promise<any> {
    if (!this.web3Provider) {
      throw new Error("No web3 provider available");
    }

    console.log(`Waiting for transaction ${txHash} to be confirmed...`);

    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      try {
        const receipt = await this.web3Provider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt) {
          console.log("Transaction confirmed:", receipt);
          return receipt;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error("Error checking transaction status:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    throw new Error("Transaction confirmation timeout");
  }

  // Helper methods
  private buildSwapPath(
    inputToken: TokenInfo,
    outputToken: TokenInfo
  ): string[] {
    const inputAddr =
      inputToken.address === "0x0000000000000000000000000000000000000000"
        ? DEX_CONFIG.WETH
        : inputToken.address;
    const outputAddr =
      outputToken.address === "0x0000000000000000000000000000000000000000"
        ? DEX_CONFIG.WETH
        : outputToken.address;

    if (inputAddr !== outputAddr) {
      return [inputAddr, outputAddr];
    }
    return [];
  }

  private calculatePriceImpact(
    inputAmount: number,
    outputAmount: number
  ): number {
    return Math.min(
      Math.abs((inputAmount - outputAmount) / inputAmount) * 100,
      5
    );
  }

  private async ensureTokenAllowance(
    tokenAddress: string,
    userAddress: string,
    requiredAmount: string
  ): Promise<void> {
    try {
      const allowanceData = this.encodeTokenAllowance(
        userAddress,
        DEX_CONFIG.ROUTER_V2
      );
      const allowanceResult = await this.web3Provider.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: allowanceData,
          },
          "latest",
        ],
      });

      const currentAllowance = parseInt(allowanceResult, 16);
      const required = parseInt(requiredAmount, 16);

      if (currentAllowance < required) {
        const approveData = this.encodeTokenApprove(
          DEX_CONFIG.ROUTER_V2,
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );

        const approveTx = await this.web3Provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: userAddress,
              to: tokenAddress,
              data: approveData,
              gas: "0x15F90",
            },
          ],
        });

        console.log("Approval transaction sent:", approveTx);
        await this.waitForTransaction(approveTx);
        console.log("Token approval confirmed");
      }
    } catch (error) {
      console.error("Failed to ensure token allowance:", error);
      throw new Error("Failed to approve token spending");
    }
  }

  // Encoding methods
  private encodeParameters(types: string[], values: any[]): string {
    let encoded = "0x";
    let dynamicPart = "";
    let offset = types.length * 32;

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const value = values[i];

      if (type === "uint256") {
        const hex = BigInt(value).toString(16);
        encoded += hex.padStart(64, "0");
      } else if (type === "address") {
        const addr = value.toLowerCase();
        const cleanAddr = addr.startsWith("0x") ? addr.slice(2) : addr;
        encoded += cleanAddr.padStart(64, "0");
      } else if (type === "address[]") {
        encoded += offset.toString(16).padStart(64, "0");
        let arrayData = value.length.toString(16).padStart(64, "0");
        for (const addr of value) {
          const cleanAddr = addr.toLowerCase().startsWith("0x")
            ? addr.slice(2)
            : addr;
          arrayData += cleanAddr.padStart(64, "0");
        }
        dynamicPart += arrayData;
        offset += (1 + value.length) * 32;
      }
    }

    return encoded + dynamicPart;
  }

  private encodeGetAmountsOut(amountIn: string, path: string[]): string {
    const functionSelector = "0xd06ca61f";
    const encodedParams = this.encodeParameters(
      ["uint256", "address[]"],
      [amountIn, path]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeSwapExactETHForTokens(
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0x7ff36ab5";
    const encodedParams = this.encodeParameters(
      ["uint256", "address[]", "address", "uint256"],
      [amountOutMin, path, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeSwapExactTokensForETH(
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0x18cbafe5";
    const encodedParams = this.encodeParameters(
      ["uint256", "uint256", "address[]", "address", "uint256"],
      [amountIn, amountOutMin, path, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeSwapExactTokensForTokens(
    amountIn: string,
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0x38ed1739";
    const encodedParams = this.encodeParameters(
      ["uint256", "uint256", "address[]", "address", "uint256"],
      [amountIn, amountOutMin, path, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeAddLiquidity(
    tokenA: string,
    tokenB: string,
    amountADesired: string,
    amountBDesired: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0xe8e33700";
    const encodedParams = this.encodeParameters(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "uint256",
      ],
      [
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline,
      ]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeAddLiquidityETH(
    token: string,
    amountTokenDesired: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0xf305d719";
    const encodedParams = this.encodeParameters(
      ["address", "uint256", "uint256", "uint256", "address", "uint256"],
      [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeRemoveLiquidity(
    tokenA: string,
    tokenB: string,
    liquidity: string,
    amountAMin: string,
    amountBMin: string,
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0xbaa2abde";
    const encodedParams = this.encodeParameters(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "uint256",
      ],
      [tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeRemoveLiquidityETH(
    token: string,
    liquidity: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: string,
    deadline: string
  ): string {
    const functionSelector = "0x02751cec";
    const encodedParams = this.encodeParameters(
      ["address", "uint256", "uint256", "uint256", "address", "uint256"],
      [token, liquidity, amountTokenMin, amountETHMin, to, deadline]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeTokenApprove(spender: string, amount: string): string {
    const functionSelector = "0x095ea7b3";
    const encodedParams = this.encodeParameters(
      ["address", "uint256"],
      [spender, amount]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeTokenAllowance(owner: string, spender: string): string {
    const functionSelector = "0xdd62ed3e";
    const encodedParams = this.encodeParameters(
      ["address", "address"],
      [owner, spender]
    );
    return functionSelector + encodedParams.slice(2);
  }

  private encodeTokenBalance(owner: string): string {
    const functionSelector = "0x70a08231";
    const encodedParams = this.encodeParameters(["address"], [owner]);
    return functionSelector + encodedParams.slice(2);
  }

  private decodeAmountsOut(result: string): number[] | null {
    if (!result || result === "0x" || result.length < 66) {
      return null;
    }

    try {
      const data = result.slice(2);
      const arrayLengthHex = data.slice(64, 128);
      const arrayLength = parseInt(arrayLengthHex, 16);
      const amounts: number[] = [];

      for (let i = 0; i < arrayLength; i++) {
        const start = 128 + i * 64;
        const end = start + 64;
        const amountHex = data.slice(start, end);
        const amount = parseInt(amountHex, 16);
        amounts.push(amount);
      }

      return amounts;
    } catch (error) {
      console.error("Failed to decode amounts:", error);
      return null;
    }
  }
}

// Singleton instance
export const dexService = new DexService();
export default dexService;
