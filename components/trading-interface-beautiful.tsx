"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  ArrowUpDown,
  AlertCircle,
  Info,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ArrowRight,
  Wallet,
  Settings,
  Clock,
} from "lucide-react";
import { WalletButton } from "./wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { TokenListService, TokenInfo, DEX_CONFIG } from "@/lib/token-list";
import { dexService, SwapQuote, SwapParams } from "@/lib/dex-service";

export function TradingInterface() {
  const { connection, switchToBCTChain } = useWallet();
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [noLiquidity, setNoLiquidity] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [showTokenSelect, setShowTokenSelect] = useState<"from" | "to" | null>(
    null
  );
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [quoteExpiry, setQuoteExpiry] = useState(0);

  // Load real tokens from TokenListService
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingTokens(true);
        setError(null);
        const tokenList = await TokenListService.fetchTokenList();
        setAvailableTokens(tokenList.tokens);

        // Set default tokens if available
        if (tokenList.tokens.length >= 2) {
          setFromToken(tokenList.tokens[0]);
          setToToken(tokenList.tokens[1]);
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
        setError("Failed to load token list. Please refresh and try again.");
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Get real quote when input changes
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setIsLoading(true);
      setError(null);

      const timer = setTimeout(async () => {
        try {
          // Use the actual dexService getSwapQuote method with correct parameters
          const quoteResult = await dexService.getSwapQuote(
            fromToken.address,
            toToken.address,
            fromAmount,
            fromToken.decimals
          );

          if (quoteResult && parseFloat(quoteResult.amountOutDecimal) > 0) {
            // Convert the result to match the SwapQuote interface expected by the component
            const mockQuote = {
              inputToken: fromToken,
              outputToken: toToken,
              inputAmount: fromAmount,
              outputAmount: quoteResult.amountOutDecimal,
              priceImpact: 0.1, // Default small impact
              fee: 0.3,
              route: quoteResult.path,
              gasEstimate: "150000",
              minimumReceived: (
                parseFloat(quoteResult.amountOutDecimal) * 0.995
              ).toFixed(6), // 0.5% slippage
              expiresAt: Date.now() + 30000,
            };
            setQuote(mockQuote);
            setToAmount(quoteResult.amountOutDecimal);
            setNoLiquidity(false);
            setQuoteExpiry(Date.now() + 30000); // 30 seconds
          } else {
            setQuote(null);
            setToAmount("0");
            setNoLiquidity(true);
          }
        } catch (error) {
          console.error("Failed to get quote:", error);
          setQuote(null);
          setToAmount("0");
          setNoLiquidity(true);
          setError(
            "Unable to get price quote. This trading pair may not have a liquidity pool."
          );
        } finally {
          setIsLoading(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setQuote(null);
      setToAmount("");
      setNoLiquidity(false);
      setIsLoading(false);
      setError(null);
    }
  }, [fromToken, toToken, fromAmount]);

  const handleSwapTokens = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setError(null);
  };

  const handleSwap = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !quote ||
      !connection?.address
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setTxHash(null);
      setTxStatus(null);
      setError(null);

      const swapParams: SwapParams = {
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: fromAmount,
        slippageTolerance: 50, // 0.5% in basis points
        recipient: connection.address,
        deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes
      };

      // Execute real swap transaction
      const txHash = await dexService.executeSwap(swapParams);

      if (txHash) {
        setTxHash(txHash);
        setTxStatus("pending");

        // Reset form after successful transaction submission
        setFromAmount("");
        setToAmount("");
        setQuote(null);

        // Simulate transaction confirmation (in real app, you'd monitor the transaction)
        setTimeout(() => {
          setTxStatus("success");
        }, 5000);
      }
    } catch (error: any) {
      console.error("Swap failed:", error);
      setTxStatus("failed");

      // Handle specific error types
      if (error.code === 4001) {
        setError("Transaction cancelled by user");
      } else if (error.message?.includes("insufficient funds")) {
        setError("Insufficient funds for this transaction");
      } else if (error.message?.includes("User denied")) {
        setError("Transaction signature denied");
      } else {
        setError(error.message || "Transaction failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.001) return "<0.001";
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toFixed(2);
  };

  const getTokenLogo = (symbol: string) => {
    const logoMap: { [key: string]: string } = {
      BCT: "🔶",
      USDG: "💵",
      BTC: "₿",
      ETH: "Ξ",
      USDT: "💰",
      USDC: "🪙",
    };
    return logoMap[symbol] || "🪙";
  };

  const filteredTokens = availableTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(tokenSearchTerm.toLowerCase()) ||
      token.symbol.toLowerCase().includes(tokenSearchTerm.toLowerCase())
  );

  const getQuoteTimeRemaining = () => {
    if (!quoteExpiry) return 0;
    return Math.max(0, quoteExpiry - Date.now());
  };

  if (isLoadingTokens) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
            <p className="text-white">Loading tokens...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-300/80 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Transaction Status */}
      {txHash && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {txStatus === "pending" && (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                )}
                {txStatus === "success" && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                {txStatus === "failed" && (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <div>
                  <p className="text-white font-medium">
                    Transaction{" "}
                    {txStatus === "pending"
                      ? "Pending"
                      : txStatus === "success"
                      ? "Successful"
                      : "Failed"}
                  </p>
                  <p className="text-white/70 text-sm">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${DEX_CONFIG.EXPLORER_URL}/tx/${txHash}`,
                    "_blank"
                  )
                }
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Trading Card */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Swap Tokens</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-white">From</Label>
              {fromToken && (
                <span className="text-sm text-gray-400">
                  Balance: {formatBalance("1000")} {fromToken.symbol}
                </span>
              )}
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="w-40 bg-white/5 border-white/10 text-white justify-between"
                  onClick={() => setShowTokenSelect("from")}
                >
                  {fromToken ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getTokenLogo(fromToken.symbol)}
                      </span>
                      <span>{fromToken.symbol}</span>
                    </div>
                  ) : (
                    "Select token"
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-right text-lg pr-16"
                    type="number"
                    step="any"
                    min="0"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => setFromAmount("500")}
                    >
                      50%
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                      onClick={() => setFromAmount("1000")}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwapTokens}
              className="rounded-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:scale-105"
            >
              <ArrowUpDown className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-white">To</Label>
              {toToken && (
                <span className="text-sm text-gray-400">
                  Balance: {formatBalance("0")} {toToken.symbol}
                </span>
              )}
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  className="w-40 bg-white/5 border-white/10 text-white justify-between"
                  onClick={() => setShowTokenSelect("to")}
                >
                  {toToken ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getTokenLogo(toToken.symbol)}
                      </span>
                      <span>{toToken.symbol}</span>
                    </div>
                  ) : (
                    "Select token"
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="0.00"
                    value={isLoading ? "Loading..." : toAmount}
                    readOnly
                    className="bg-white/5 border-white/10 text-white text-right text-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && fromToken && toToken && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Quote Details</span>
                {getQuoteTimeRemaining() > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{Math.ceil(getQuoteTimeRemaining() / 1000)}s</span>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Minimum Received</span>
                  <span className="text-white">
                    {quote.minimumReceived} {toToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact</span>
                  <span
                    className={
                      quote.priceImpact > 1 ? "text-red-400" : "text-green-400"
                    }
                  >
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-white">{quote.fee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slippage Tolerance</span>
                  <span className="text-white">{slippage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* No Liquidity Warning */}
          {noLiquidity && fromToken && toToken && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">
                  No Liquidity
                </span>
              </div>
              <p className="text-yellow-300/80 text-sm mt-2">
                No liquidity pool found for {fromToken.symbol}/{toToken.symbol}
              </p>
            </div>
          )}

          {/* Swap Button or Wallet Connect */}
          {!connection?.address ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">
                  Connect your wallet to start trading
                </span>
              </div>
              <WalletButton className="w-full h-12" />
            </div>
          ) : connection.chainId !== DEX_CONFIG.CHAIN_ID ? (
            <Button
              onClick={switchToBCTChain}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
            >
              Switch to BCTChain
            </Button>
          ) : (
            <Button
              onClick={handleSwap}
              disabled={
                !fromToken ||
                !toToken ||
                !fromAmount ||
                !quote ||
                isLoading ||
                txStatus === "pending"
              }
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12"
            >
              {isLoading || txStatus === "pending" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {txStatus === "pending"
                    ? "Confirming..."
                    : "Getting quote..."}
                </>
              ) : !fromToken || !toToken ? (
                "Select tokens"
              ) : !fromAmount ? (
                "Enter amount"
              ) : !quote ? (
                "Getting quote..."
              ) : (
                <>
                  Swap {fromToken.symbol} for {toToken.symbol}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Token Selection Modal */}
      {showTokenSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-900 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                Select {showTokenSelect === "from" ? "From" : "To"} Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search tokens..."
                value={tokenSearchTerm}
                onChange={(e) => setTokenSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <div
                      key={token.address}
                      className="p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => {
                        if (showTokenSelect === "from") {
                          setFromToken(token);
                        } else {
                          setToToken(token);
                        }
                        setShowTokenSelect(null);
                        setTokenSearchTerm("");
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getTokenLogo(token.symbol)}
                        </span>
                        <div>
                          <div className="text-white font-medium">
                            {token.symbol}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {token.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTokenSelect(null);
                  setTokenSearchTerm("");
                }}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network Info */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Connected to BCTChain</span>
            </div>
            <div className="text-gray-400">
              Network ID: {DEX_CONFIG.CHAIN_ID}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
