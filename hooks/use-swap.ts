import { useState, useEffect, useCallback } from "react";
import {
  Token,
  SwapQuote,
  SwapParams,
  MockSwapQuoter,
  MockSwapExecutor,
  MOCK_TOKENS,
} from "@/lib/dex-utils";

export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  isLoading: boolean;
  quote: SwapQuote | null;
  error: string | null;
  isSwapping: boolean;
}

export interface SwapActions {
  setFromToken: (token: Token | null) => void;
  setToToken: (token: Token | null) => void;
  setFromAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  swapTokens: () => void;
  executeSwap: () => Promise<string | null>;
  refreshQuote: () => void;
  resetState: () => void;
}

const initialState: SwapState = {
  fromToken: null,
  toToken: null,
  fromAmount: "",
  toAmount: "",
  slippage: 0.5,
  isLoading: false,
  quote: null,
  error: null,
  isSwapping: false,
};

export function useSwap(): SwapState & SwapActions {
  const [state, setState] = useState<SwapState>(() => ({
    ...initialState,
    fromToken: MOCK_TOKENS[0],
    toToken: MOCK_TOKENS[1],
  }));

  // Auto-fetch quote when inputs change
  const fetchQuote = useCallback(async () => {
    if (!state.fromToken || !state.toToken || !state.fromAmount) {
      setState((prev) => ({ ...prev, quote: null, toAmount: "", error: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params: SwapParams = {
        fromToken: state.fromToken,
        toToken: state.toToken,
        amount: state.fromAmount,
        slippage: state.slippage,
      };

      const quote = await MockSwapQuoter.getQuote(params);

      if (quote) {
        setState((prev) => ({
          ...prev,
          quote,
          toAmount: quote.toAmount,
          isLoading: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          quote: null,
          toAmount: "",
          isLoading: false,
          error: "Unable to get quote",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        quote: null,
        toAmount: "",
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch quote",
      }));
    }
  }, [state.fromToken, state.toToken, state.fromAmount, state.slippage]);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // Actions
  const setFromToken = useCallback((token: Token | null) => {
    setState((prev) => ({ ...prev, fromToken: token }));
  }, []);

  const setToToken = useCallback((token: Token | null) => {
    setState((prev) => ({ ...prev, toToken: token }));
  }, []);

  const setFromAmount = useCallback((amount: string) => {
    setState((prev) => ({ ...prev, fromAmount: amount }));
  }, []);

  const setSlippage = useCallback((slippage: number) => {
    setState((prev) => ({ ...prev, slippage }));
  }, []);

  const swapTokens = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  }, []);

  const executeSwap = useCallback(async (): Promise<string | null> => {
    if (!state.quote) return null;

    setState((prev) => ({ ...prev, isSwapping: true, error: null }));

    try {
      const txHash = await MockSwapExecutor.executeSwap(state.quote);

      setState((prev) => ({
        ...prev,
        isSwapping: false,
        fromAmount: "",
        toAmount: "",
        quote: null,
        error: null,
      }));

      return txHash;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSwapping: false,
        error: error instanceof Error ? error.message : "Swap failed",
      }));
      return null;
    }
  }, [state.quote]);

  const refreshQuote = useCallback(() => {
    fetchQuote();
  }, [fetchQuote]);

  const resetState = useCallback(() => {
    setState({
      ...initialState,
      fromToken: MOCK_TOKENS[0],
      toToken: MOCK_TOKENS[1],
    });
  }, []);

  return {
    ...state,
    setFromToken,
    setToToken,
    setFromAmount,
    setSlippage,
    swapTokens,
    executeSwap,
    refreshQuote,
    resetState,
  };
}
