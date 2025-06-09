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

// Uniswap V2 Router ABI (minimal interface)
const ROUTER_V2_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
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

export class DexService {
  private web3Provider: any = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      // Try to connect to injected provider (MetaMask, etc.)
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

      // Switch to correct chain if needed
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
      // Chain not added to wallet
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
      // Handle native token
      if (
        tokenAddress === DEX_CONFIG.NATIVE_TOKEN.address ||
        tokenAddress === "0x0000000000000000000000000000000000000000"
      ) {
        const balance = await this.web3Provider.request({
          method: "eth_getBalance",
          params: [walletAddress, "latest"],
        });
        // Convert from wei to ether (simplified)
        return (parseInt(balance, 16) / Math.pow(10, 18)).toString();
      }

      // Handle ERC20 token - would need to make contract call
      // For now, return mock data
      return "0";
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

      // Validate input amount
      const inputValue = parseFloat(inputAmount);
      if (inputValue <= 0) {
        console.error("Invalid input amount");
        return null;
      }

      // Convert input amount to wei
      const inputAmountWei = `0x${Math.floor(
        inputValue * Math.pow(10, inputToken.decimals)
      ).toString(16)}`;

      // Build the swap path
      const path = this.buildSwapPath(inputToken, outputToken);
      if (path.length === 0) {
        console.error("No valid swap path found");
        return null;
      }

      console.log("Getting quote for path:", path);
      console.log("Input amount (wei):", inputAmountWei);

      // Call getAmountsOut on the router contract
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

      console.log("Router response:", result);

      // Decode the result
      const amounts = this.decodeAmountsOut(result);
      if (!amounts || amounts.length < 2) {
        console.error("Invalid amounts returned from router");
        return null;
      }

      // The last amount in the array is the output amount
      const outputAmountWei = amounts[amounts.length - 1];
      const outputAmount = (
        outputAmountWei / Math.pow(10, outputToken.decimals)
      ).toString();

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(
        inputValue,
        parseFloat(outputAmount)
      );

      // Calculate minimum received with slippage
      const slippageMultiplier = (10000 - slippageTolerance) / 10000;
      const minimumReceived = (
        parseFloat(outputAmount) * slippageMultiplier
      ).toFixed(6);

      console.log("Quote calculated:", {
        inputAmount,
        outputAmount,
        priceImpact,
        minimumReceived,
      });

      return {
        inputToken,
        outputToken,
        inputAmount,
        outputAmount: parseFloat(outputAmount).toFixed(6),
        priceImpact,
        fee: 0.3, // 0.3% standard Uniswap V2 fee
        route: path,
        gasEstimate: "200000", // Estimated gas for swap
        minimumReceived,
        expiresAt: Date.now() + 60000, // 1 minute expiry
      };
    } catch (error: any) {
      console.error("Failed to get swap quote:", error);

      // Check if it's a specific error indicating no liquidity
      if (
        error.message?.includes("INSUFFICIENT_OUTPUT_AMOUNT") ||
        error.message?.includes("INSUFFICIENT_LIQUIDITY") ||
        error.code === -32000
      ) {
        console.error("No liquidity available for this trading pair");
        return null;
      }

      return null;
    }
  }

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

    // For direct pairs
    if (inputAddr !== outputAddr) {
      return [inputAddr, outputAddr];
    }

    return [];
  }

  private calculatePriceImpact(
    inputAmount: number,
    outputAmount: number
  ): number {
    // Simplified price impact calculation
    // In a real implementation, you'd compare against the theoretical price
    // without slippage based on current reserves
    return Math.min(
      Math.abs((inputAmount - outputAmount) / inputAmount) * 100,
      5
    );
  }

  private encodeGetAmountsOut(amountIn: string, path: string[]): string {
    // getAmountsOut(uint amountIn, address[] calldata path)
    // Function selector: 0xd06ca61f
    const functionSelector = "0xd06ca61f";

    const encodedParams = this.encodeParameters(
      ["uint256", "address[]"],
      [amountIn, path]
    );

    return functionSelector + encodedParams.slice(2);
  }

  private decodeAmountsOut(result: string): number[] | null {
    if (!result || result === "0x" || result.length < 66) {
      return null;
    }

    try {
      // Remove 0x prefix
      const data = result.slice(2);

      // First 32 bytes is the offset to the array
      // Next 32 bytes is the array length
      const arrayLengthHex = data.slice(64, 128);
      const arrayLength = parseInt(arrayLengthHex, 16);

      const amounts: number[] = [];

      // Read each amount (32 bytes each)
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
      // Get user's address
      const accounts = await this.web3Provider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet address found");
      }

      const userAddress = recipient || accounts[0];
      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes from now

      // Calculate minimum output amount with slippage
      const quote = await this.getSwapQuote(params);
      if (!quote) {
        throw new Error("Unable to get swap quote");
      }

      const minimumOutput = quote.minimumReceived;

      // Convert amounts to wei (assuming 18 decimals for simplicity)
      const inputAmountWei = `0x${Math.floor(
        parseFloat(inputAmount) * Math.pow(10, inputToken.decimals)
      ).toString(16)}`;
      const minimumOutputWei = `0x${Math.floor(
        parseFloat(minimumOutput) * Math.pow(10, outputToken.decimals)
      ).toString(16)}`;
      const deadlineHex = `0x${swapDeadline.toString(16)}`;

      // Check if input token is native BCT
      const isNativeInput =
        inputToken.address === "0x0000000000000000000000000000000000000000";
      const isNativeOutput =
        outputToken.address === "0x0000000000000000000000000000000000000000";

      let txParams: any = {
        from: userAddress,
        to: DEX_CONFIG.ROUTER_V2,
        gas: "0x61A80", // 400,000 gas limit
      };

      if (isNativeInput && !isNativeOutput) {
        // Swapping BCT for tokens - call swapExactETHForTokens
        const data = this.encodeSwapExactETHForTokens(
          minimumOutputWei,
          [DEX_CONFIG.WETH, outputToken.address],
          userAddress,
          deadlineHex
        );

        txParams.data = data;
        txParams.value = inputAmountWei; // Send BCT value
      } else if (!isNativeInput && isNativeOutput) {
        // Swapping tokens for BCT - call swapExactTokensForETH
        // First check/approve token allowance
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
        // Swapping tokens for tokens - call swapExactTokensForTokens
        // First check/approve token allowance
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

      // Send transaction via MetaMask
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

  private async ensureTokenAllowance(
    tokenAddress: string,
    userAddress: string,
    requiredAmount: string
  ): Promise<void> {
    try {
      // Check current allowance
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
        // Need to approve more tokens
        const approveData = this.encodeTokenApprove(
          DEX_CONFIG.ROUTER_V2,
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ); // Max approval

        const approveTx = await this.web3Provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: userAddress,
              to: tokenAddress,
              data: approveData,
              gas: "0x15F90", // 90,000 gas limit for approval
            },
          ],
        });

        console.log("Approval transaction sent:", approveTx);

        // Wait for approval to be mined
        await this.waitForTransaction(approveTx);
        console.log("Token approval confirmed");
      }
    } catch (error) {
      console.error("Failed to ensure token allowance:", error);
      throw new Error("Failed to approve token spending");
    }
  }

  // Helper functions to encode contract calls
  private encodeSwapExactETHForTokens(
    amountOutMin: string,
    path: string[],
    to: string,
    deadline: string
  ): string {
    // swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
    // Function selector: 0x7ff36ab5
    const functionSelector = "0x7ff36ab5";

    // Encode parameters (simplified - in production use a proper ABI encoder)
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
    // swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    // Function selector: 0x18cbafe5
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
    // swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    // Function selector: 0x38ed1739
    const functionSelector = "0x38ed1739";

    const encodedParams = this.encodeParameters(
      ["uint256", "uint256", "address[]", "address", "uint256"],
      [amountIn, amountOutMin, path, to, deadline]
    );

    return functionSelector + encodedParams.slice(2);
  }

  private encodeTokenApprove(spender: string, amount: string): string {
    // approve(address spender, uint256 amount)
    // Function selector: 0x095ea7b3
    const functionSelector = "0x095ea7b3";

    const encodedParams = this.encodeParameters(
      ["address", "uint256"],
      [spender, amount]
    );

    return functionSelector + encodedParams.slice(2);
  }

  private encodeTokenAllowance(owner: string, spender: string): string {
    // allowance(address owner, address spender)
    // Function selector: 0xdd62ed3e
    const functionSelector = "0xdd62ed3e";

    const encodedParams = this.encodeParameters(
      ["address", "address"],
      [owner, spender]
    );

    return functionSelector + encodedParams.slice(2);
  }

  private encodeParameters(types: string[], values: any[]): string {
    // Simplified parameter encoding - in production, use ethers.js or web3.js ABI encoder
    let encoded = "0x";
    let dynamicPart = "";
    let offset = types.length * 32; // Initial offset for dynamic data

    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const value = values[i];

      if (type === "uint256") {
        let hex: string;
        if (typeof value === "string" && value.startsWith("0x")) {
          hex = value.slice(2);
        } else if (typeof value === "string") {
          hex = parseInt(value, 16).toString(16);
        } else {
          hex = value.toString(16);
        }
        encoded += hex.padStart(64, "0");
      } else if (type === "address") {
        const addr = value.toLowerCase().startsWith("0x")
          ? value.slice(2)
          : value;
        encoded += addr.padStart(64, "0");
      } else if (type === "address[]") {
        // For array, encode offset to where array data starts
        encoded += offset.toString(16).padStart(64, "0");

        // Prepare array data for dynamic part
        const arrayLength = value.length.toString(16).padStart(64, "0");
        let arrayData = arrayLength;

        for (const addr of value) {
          const cleanAddr = addr.toLowerCase().startsWith("0x")
            ? addr.slice(2)
            : addr;
          arrayData += cleanAddr.padStart(64, "0");
        }

        dynamicPart += arrayData;
        offset += (1 + value.length) * 32; // Update offset for next dynamic type
      }
    }

    return encoded + dynamicPart;
  }

  async getTransactionReceipt(txHash: string) {
    if (!this.web3Provider) return null;

    try {
      return await this.web3Provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
    } catch (error) {
      console.error("Failed to get transaction receipt:", error);
      return null;
    }
  }

  async waitForTransaction(txHash: string, confirmations: number = 1) {
    // Simple polling implementation for transaction confirmation
    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {
          const receipt = await this.getTransactionReceipt(txHash);
          if (receipt && receipt.blockNumber) {
            resolve(receipt);
          } else {
            setTimeout(checkTransaction, 2000); // Check every 2 seconds
          }
        } catch (error) {
          reject(error);
        }
      };
      checkTransaction();
    });
  }
}

// Singleton instance
export const dexService = new DexService();
export default dexService;
