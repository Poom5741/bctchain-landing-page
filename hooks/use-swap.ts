import React, { useState, useEffect, useCallback } from "react";
import { TokenInfo, DEX_CONFIG, EXAMPLE_TOKEN_LIST } from "@/lib/token-list";
import {
  dexService,
  initializeDexService,
  DexService,
} from "@/lib/dex-service";
import { useWalletContext as useWallet } from "@/contexts/wallet-context";
import { toast } from "@/components/ui/use-toast";
import { ToastAction, type ToastActionElement } from "@/components/ui/toast"; // Assuming this path is correct and exports ToastAction

interface HookSwapQuote {
  amountOutDecimal: string;
  path: string[];
  amounts: bigint[];
  priceImpact?: number | null;
}

export interface UseSwapReturn {
  inputToken: TokenInfo | null;
  outputToken: TokenInfo | null;
  inputAmount: string;
  outputAmount: string;
  slippageTolerance: number;
  priceImpact: number | null;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  quote: HookSwapQuote | null;
  error: string | null;
  tokens: TokenInfo[];
  inputTokenBalance: string;
  outputTokenBalance: string;
  setInputToken: (token: TokenInfo) => Promise<void>;
  setOutputToken: (token: TokenInfo) => Promise<void>;
  setInputAmount: (amount: string) => void;
  setSlippageTolerance: (tolerance: number) => void;
  handleSwap: () => Promise<void>;
  switchTokens: () => void;
  refreshBalances: () => Promise<void>;
}

const DEFAULT_SLIPPAGE_TOLERANCE = 50; // 0.5%

export function useSwap(): UseSwapReturn {
  const { connection } = useWallet();
  const { address, isConnected } = connection;
  const [tokens, setTokens] = useState<TokenInfo[]>(EXAMPLE_TOKEN_LIST.tokens);
  const [inputToken, setInputTokenState] = useState<TokenInfo | null>(null);
  const [outputToken, setOutputTokenState] = useState<TokenInfo | null>(null);
  const [inputAmount, setInputAmountState] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [slippageTolerance, setSlippageToleranceState] = useState(
    DEFAULT_SLIPPAGE_TOLERANCE
  );
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quote, setQuote] = useState<HookSwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [allTokenBalances, setAllTokenBalances] = useState<
    Record<
      string,
      { balance: string; decimals: number; name: string; symbol: string }
    >
  >({});
  const [inputTokenBalance, setInputTokenBalance] = useState("0");
  const [outputTokenBalance, setOutputTokenBalance] = useState("0");

  const [isDexServiceReady, setIsDexServiceReady] = useState(false);

  useEffect(() => {
    const initializeDexServiceAsync = async () => {
      if (isConnected && typeof window !== "undefined" && window.ethereum) {
        try {
          // Create BrowserProvider from the ethereum object
          const { BrowserProvider } = await import("ethers");
          const walletProvider = new BrowserProvider(window.ethereum);

          // Initialize the DexService
          initializeDexService(walletProvider);

          // Verify the provider is actually ready by making a simple call
          // This helps ensure the provider is functional before setting ready state
          const accounts = await walletProvider.listAccounts();

          // Small delay to ensure contracts are properly initialized
          await new Promise((resolve) => setTimeout(resolve, 100));

          setIsDexServiceReady(true);
          console.log("DexService initialized and verified in useSwap");
        } catch (error) {
          console.error("Failed to initialize DexService:", error);
          setIsDexServiceReady(false);
        }
      } else {
        setIsDexServiceReady(false);
        // console.log("DexService waiting for provider in useSwap");
      }
    };

    initializeDexServiceAsync();
  }, [isConnected]);

  const refreshBalances = useCallback(async () => {
    if (address && isDexServiceReady) {
      try {
        // console.log("Refreshing balances for:", address);
        const balances = await dexService.getUserTokenBalances(address);

        // Check if we actually got valid balances
        if (balances && Object.keys(balances).length > 0) {
          setAllTokenBalances(balances);
          console.log("🔍 Balances refreshed:", balances);

          if (inputToken) {
            const inputBalance = balances[inputToken.address.toLowerCase()]?.balance || "0";
            console.log(`🔍 Setting ${inputToken.symbol} balance: ${inputBalance} (decimals: ${balances[inputToken.address.toLowerCase()]?.decimals})`);
            setInputTokenBalance(inputBalance);
          }
          if (outputToken) {
            const outputBalance = balances[outputToken.address.toLowerCase()]?.balance || "0";
            console.log(`🔍 Setting ${outputToken.symbol} balance: ${outputBalance} (decimals: ${balances[outputToken.address.toLowerCase()]?.decimals})`);
            setOutputTokenBalance(outputBalance);
          }
        } else {
          console.warn(
            "No balances returned from DexService.getUserTokenBalances"
          );
        }
      } catch (err) {
        console.error("Failed to refresh balances:", err);
        console.error(
          "Address:",
          address,
          "isDexServiceReady:",
          isDexServiceReady
        );
      }
    } else {
      console.log(
        "Skipping balance refresh - address:",
        address,
        "isDexServiceReady:",
        isDexServiceReady
      );
    }
  }, [address, inputToken, outputToken, isDexServiceReady]);

  // Effect to set default tokens
  useEffect(() => {
    if (tokens.length > 0 && !inputToken && !outputToken && isConnected) {
      const nativeTokenSymbol = DEX_CONFIG.NATIVE_TOKEN.symbol;
      let defaultInput = tokens.find((t) => t.symbol === nativeTokenSymbol);

      if (!defaultInput && tokens.length > 0) {
        defaultInput = tokens[0];
      }

      let defaultOutput: TokenInfo | null = null;
      if (defaultInput && tokens.length > 1) {
        defaultOutput =
          tokens.find(
            (t) =>
              t.address.toLowerCase() !== defaultInput!.address.toLowerCase()
          ) || null;
      } else if (defaultInput && tokens.length === 1) {
        defaultOutput = null;
      }

      if (defaultInput) setInputTokenState(defaultInput);
      if (defaultOutput) setOutputTokenState(defaultOutput);
    }
  }, [tokens, inputToken, outputToken, isConnected]);

  useEffect(() => {
    if (address && isDexServiceReady) {
      refreshBalances();
    }
  }, [address, refreshBalances, isDexServiceReady, inputToken, outputToken]);

  const setInputToken = async (token: TokenInfo) => {
    if (
      outputToken &&
      token.address.toLowerCase() === outputToken.address.toLowerCase()
    ) {
      setOutputTokenState(inputToken);
      if (inputToken)
        setOutputTokenBalance(
          allTokenBalances[inputToken.address.toLowerCase()]?.balance || "0"
        );
    }
    setInputTokenState(token);
    setInputTokenBalance(
      allTokenBalances[token.address.toLowerCase()]?.balance || "0"
    );

    // Refresh balances immediately when token changes
    if (address && isDexServiceReady) {
      await refreshBalances();
    }
  };

  const setOutputToken = async (token: TokenInfo) => {
    if (
      inputToken &&
      token.address.toLowerCase() === inputToken.address.toLowerCase()
    ) {
      setInputTokenState(outputToken);
      if (outputToken)
        setInputTokenBalance(
          allTokenBalances[outputToken.address.toLowerCase()]?.balance || "0"
        );
    }
    setOutputTokenState(token);
    setOutputTokenBalance(
      allTokenBalances[token.address.toLowerCase()]?.balance || "0"
    );

    // Refresh balances immediately when token changes
    if (address && isDexServiceReady) {
      await refreshBalances();
    }
  };

  const switchTokens = () => {
    const currentInput = inputToken;
    const currentOutput = outputToken;
    const currentInputAmount = inputAmount;
    const currentOutputAmount = outputAmount;

    setInputTokenState(currentOutput);
    setOutputTokenState(currentInput);
    setInputAmountState(currentOutputAmount);
    setOutputAmount(currentInputAmount);

    if (currentOutput)
      setInputTokenBalance(
        allTokenBalances[currentOutput.address.toLowerCase()]?.balance || "0"
      );
    if (currentInput)
      setOutputTokenBalance(
        allTokenBalances[currentInput.address.toLowerCase()]?.balance || "0"
      );
  };

  const setInputAmount = (amount: string) => {
    setInputAmountState(amount);
    if (
      amount === "" ||
      parseFloat(amount) === 0 ||
      isNaN(parseFloat(amount))
    ) {
      setOutputAmount("");
      setQuote(null);
      setPriceImpact(null);
    }
  };

  const setSlippageTolerance = (tolerance: number) => {
    setSlippageToleranceState(tolerance);
  };

  useEffect(() => {
    if (
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      parseFloat(inputAmount) <= 0 ||
      isNaN(parseFloat(inputAmount)) ||
      !isDexServiceReady
    ) {
      setQuote(null);
      setOutputAmount("");
      setPriceImpact(null);
      return;
    }

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      setError(null);
      try {
        const fetchedQuoteResult = await dexService.getSwapQuote(
          inputToken.address,
          outputToken.address,
          inputAmount,
          inputToken.decimals
        );

        if (
          fetchedQuoteResult &&
          parseFloat(fetchedQuoteResult.amountOutDecimal) > 0
        ) {
          setQuote(fetchedQuoteResult);
          setOutputAmount(fetchedQuoteResult.amountOutDecimal);
          setPriceImpact(null); // TODO: Price impact calculation
        } else {
          setOutputAmount("");
          setQuote(null);
          setPriceImpact(null);
        }
      } catch (err: any) {
        console.error("Failed to fetch swap quote:", err);
        setError(err.message || "Failed to fetch quote.");
        setQuote(null);
        setOutputAmount("");
        setPriceImpact(null);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounceTimeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounceTimeout);
  }, [
    inputToken,
    outputToken,
    inputAmount,
    slippageTolerance,
    isDexServiceReady,
  ]);

  const handleSwap = async () => {
    if (
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      !quote ||
      !address ||
      !isDexServiceReady
    ) {
      setError(
        "Please fill all fields, connect wallet, and ensure service is ready."
      );
      toast({
        title: "Swap Error",
        description:
          "Missing information, wallet not connected, or service not ready.",
        variant: "destructive",
      });
      return;
    }

    const currentInputBalance = parseFloat(
      allTokenBalances[inputToken.address.toLowerCase()]?.balance || "0"
    );
    if (parseFloat(inputAmount) > currentInputBalance) {
      toast({
        title: "Swap Error",
        description: `Insufficient ${inputToken.symbol} balance. You have ${currentInputBalance}, trying to swap ${inputAmount}.`,
        variant: "destructive",
      });
      setError(`Insufficient ${inputToken.symbol} balance.`);
      return;
    }

    const outputTokenDecimals = outputToken.decimals;
    const amountOutBigInt = DexService.parseDecimalToWeiBigInt(
      quote.amountOutDecimal,
      outputTokenDecimals
    );
    const slippageFactor = BigInt(10000 - slippageTolerance);
    const amountOutMinWei = (amountOutBigInt * slippageFactor) / BigInt(10000);
    const amountOutMinDecimal = DexService.formatWeiToDecimal(
      amountOutMinWei,
      outputTokenDecimals
    );

    setIsSwapping(true);
    setError(null);
    let txHash: string | null = null;
    try {
      txHash = await dexService.executeSwap(
        address,
        inputToken.address,
        outputToken.address,
        inputAmount,
        amountOutMinDecimal,
        quote.path,
        20 // deadline in minutes
      );

      if (!txHash) {
        throw new Error(
          "Swap transaction submission failed. No transaction hash returned."
        );
      }

      toast({
        title: "Transaction Submitted",
        description: `Swap transaction submitted. Waiting for confirmation.`,
        action: React.createElement(ToastAction, {
          asChild: true,
          altText: "View on Explorer",
          children: React.createElement(
            "a",
            {
              href: `${DEX_CONFIG.EXPLORER_URL}/tx/${txHash}`,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            "View on Explorer"
          ),
        }) as ToastActionElement,
      });

      await dexService.waitForTransaction(txHash);

      const finalOutputAmount = DexService.formatWeiToDecimal(
        quote.amounts[quote.amounts.length - 1],
        outputTokenDecimals
      );

      toast({
        title: "Swap Successful!",
        description: `Swapped ${inputAmount} ${inputToken.symbol} for ~ ${finalOutputAmount} ${outputToken.symbol}.`,
      });
      setInputAmountState("");
      setOutputAmount("");
      setQuote(null);
      await refreshBalances();
    } catch (err: any) {
      console.error("Swap failed:", err);
      const errorMessage =
        err.message || "An unknown error occurred during the swap.";
      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive",
        action: txHash
          ? (React.createElement(ToastAction, {
              asChild: true,
              altText: "View Failed Tx on Explorer",
              children: React.createElement(
                "a",
                {
                  href: `${DEX_CONFIG.EXPLORER_URL}/tx/${txHash}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
                "View Transaction"
              ),
            }) as ToastActionElement)
          : undefined,
      });
      setError(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  };

  return {
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    slippageTolerance,
    priceImpact,
    isLoadingQuote,
    isSwapping,
    quote,
    error,
    tokens,
    inputTokenBalance,
    outputTokenBalance,
    setInputToken,
    setOutputToken,
    setInputAmount,
    setSlippageTolerance,
    handleSwap,
    switchTokens,
    refreshBalances,
  };
}

// Default export for compatibility
export default useSwap;
