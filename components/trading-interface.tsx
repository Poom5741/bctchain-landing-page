"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpDown,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Search,
  X,
} from "lucide-react";
import { WalletButton } from "./wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { TokenListService, TokenInfo, DEX_CONFIG } from "@/lib/token-list";
import { dexService, SwapQuote, SwapParams } from "@/lib/dex-service";

interface Transaction {
  id: string;
  type: "swap" | "liquidity" | "bridge";
  status: "pending" | "success" | "failed";
  fromToken: string;
  toToken?: string;
  amount: string;
  timestamp: number;
  hash?: string;
}

// Mock transactions for display
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "swap",
    status: "success",
    fromToken: "RAJ",
    toToken: "LISA",
    amount: "100",
    timestamp: Date.now() - 300000,
    hash: "0x1234...5678",
  },
  {
    id: "2",
    type: "swap",
    status: "pending",
    fromToken: "WETH",
    toToken: "RAJ",
    amount: "0.5",
    timestamp: Date.now() - 150000,
    hash: "0x9abc...def0",
  },
];

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

  // Load tokens from TokenListService
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingTokens(true);
        const tokenList = await TokenListService.fetchTokenList();
        setAvailableTokens(tokenList.tokens);

        // Set default tokens if available
        if (tokenList.tokens.length >= 2) {
          setFromToken(tokenList.tokens[0]);
          setToToken(tokenList.tokens[1]);
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
        // Use empty array as fallback
        setAvailableTokens([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Generate quote when inputs change
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setIsLoading(true);

      const timer = setTimeout(async () => {
        try {
          const swapParams: SwapParams = {
            inputToken: fromToken,
            outputToken: toToken,
            inputAmount: fromAmount,
            slippageTolerance: 50, // 0.5% in basis points
          };

          console.log("Getting real quote for:", swapParams);
          const quote = await dexService.getSwapQuote(swapParams);

          if (quote) {
            console.log("Real quote received:", quote);
            setQuote(quote);
            setToAmount(quote.outputAmount);
            setNoLiquidity(false);
          } else {
            console.log("No liquidity available for this trading pair");
            setQuote(null);
            setToAmount("0");
            setNoLiquidity(true);
          }
        } catch (error) {
          console.error("Failed to get quote:", error);
          setQuote(null);
          setToAmount("0");
          setNoLiquidity(true);
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
  };

  const handleSwap = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!fromToken || !toToken || !fromAmount || !quote || !connection?.address)
      return;

    try {
      setIsLoading(true);
      console.log("Starting swap transaction...");

      const swapParams: SwapParams = {
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: fromAmount,
        slippageTolerance: 50, // 0.5% in basis points
        recipient: connection.address,
        deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes
      };

      console.log("Swap parameters:", swapParams);

      // This will now trigger MetaMask and send real transactions
      const txHash = await dexService.executeSwap(swapParams);

      console.log("Transaction hash received:", txHash);

      // Show success message or transaction hash to user
      if (txHash) {
        // Reset form after successful transaction submission
        setFromAmount("");
        setToAmount("");
        setQuote(null);

        // You could add a toast notification here
        console.log("Swap transaction submitted successfully!");
        console.log("Transaction hash:", txHash);
        console.log(
          `View on explorer: ${DEX_CONFIG.EXPLORER_URL}/tx/${txHash}`
        );
      }
    } catch (error: any) {
      console.error("Swap failed:", error);

      // Handle specific error types
      if (error.code === 4001) {
        console.log("User rejected the transaction");
      } else if (error.code === -32603) {
        console.log("Internal JSON-RPC error");
      } else if (error.message?.includes("insufficient funds")) {
        console.log("Insufficient funds for transaction");
      } else if (error.message?.includes("User denied")) {
        console.log("User denied transaction signature");
      } else {
        console.log("Transaction failed:", error.message);
      }

      // Don't reset form on error so user can try again
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingTokens) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading tokens...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              BCT DEX - Trading Interface
            </h2>
            <p className="text-gray-400 text-lg">
              Trade assets with zero slippage and deep liquidity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Swap Interface */}
            <div className="lg:col-span-2">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowUpDown className="w-5 h-5 mr-2" />
                    Swap Assets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Demo Mode Warning */}
                  <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-200 flex items-start space-x-3">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Production Ready</h4>
                      <p className="text-sm opacity-90 mt-1">
                        Real trading with production smart contracts on BCTChain
                        network.
                      </p>
                    </div>
                  </div>

                  {/* From Token */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white">From</span>
                      <span className="text-sm text-gray-400">
                        Select token to trade
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <select
                        className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                        value={fromToken?.symbol || ""}
                        onChange={(e) => {
                          const token = availableTokens.find(
                            (t: TokenInfo) => t.symbol === e.target.value
                          );
                          setFromToken(token || null);
                        }}
                      >
                        <option value="" className="bg-slate-800">
                          Select token
                        </option>
                        {availableTokens.map((token: TokenInfo) => (
                          <option
                            key={token.symbol}
                            value={token.symbol}
                            className="bg-slate-800"
                          >
                            {token.symbol}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="0.00"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="flex-1 bg-white/5 border-white/10 text-white text-right"
                        type="number"
                        step="any"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Swap Direction Button */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSwapTokens}
                      className="rounded-full p-3 bg-white/5 hover:bg-white/10 border border-white/10"
                      disabled={!fromToken || !toToken}
                    >
                      <ArrowUpDown className="w-4 h-4 text-white" />
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white">To</span>
                      <span className="text-sm text-gray-400">
                        Select destination token
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <select
                        className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                        value={toToken?.symbol || ""}
                        onChange={(e) => {
                          const token = availableTokens.find(
                            (t: TokenInfo) => t.symbol === e.target.value
                          );
                          setToToken(token || null);
                        }}
                      >
                        <option value="" className="bg-slate-800">
                          Select token
                        </option>
                        {availableTokens.map((token: TokenInfo) => (
                          <option
                            key={token.symbol}
                            value={token.symbol}
                            className="bg-slate-800"
                          >
                            {token.symbol}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="0.00"
                        value={isLoading ? "Loading..." : toAmount}
                        readOnly
                        className="flex-1 bg-white/5 border-white/10 text-white text-right"
                      />
                    </div>
                  </div>

                  {/* Quote Details */}
                  {quote && (
                    <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-gray-400 text-sm">
                        Quote Details
                      </span>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exchange Rate</span>
                          <span className="text-white">
                            1 {fromToken?.symbol} ={" "}
                            {(
                              parseFloat(quote.outputAmount) /
                              parseFloat(quote.inputAmount)
                            ).toFixed(4)}{" "}
                            {toToken?.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price Impact</span>
                          <span className="text-green-400">
                            {quote.priceImpact}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Minimum Received
                          </span>
                          <span className="text-white">
                            {quote.minimumReceived} {toToken?.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estimated Gas</span>
                          <span className="text-white">
                            {quote.gasEstimate} BCT
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Swap Button or Wallet Connect */}
                  {!connection.isConnected ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">
                          Connect your wallet to start trading
                        </span>
                      </div>
                      <WalletButton className="w-full h-12" />
                    </div>
                  ) : !connection.isCorrectNetwork ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">
                          Switch to BCTChain network to trade
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={switchToBCTChain}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                      >
                        Switch to BCTChain Network
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSwap}
                      disabled={
                        !fromToken ||
                        !toToken ||
                        !fromAmount ||
                        !quote ||
                        isLoading ||
                        noLiquidity ||
                        fromToken.symbol === toToken.symbol
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12 disabled:opacity-50"
                    >
                      {isLoading
                        ? "Getting quote..."
                        : !fromToken || !toToken
                        ? "Select tokens"
                        : fromToken.symbol === toToken.symbol
                        ? "Select different tokens"
                        : !fromAmount
                        ? "Enter amount"
                        : noLiquidity
                        ? "No liquidity available"
                        : !quote
                        ? "No quote available"
                        : `Swap ${fromToken.symbol} for ${toToken.symbol}`}
                    </Button>
                  )}

                  {/* No Liquidity Warning */}
                  {noLiquidity && fromAmount && parseFloat(fromAmount) > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 flex items-center space-x-2 mt-3">
                      <AlertCircle className="w-4 h-4" />
                      <div className="text-sm">
                        <div className="font-medium">No Liquidity Pool</div>
                        <div className="opacity-90">
                          There is no liquidity pool for {fromToken?.symbol} ↔ {toToken?.symbol}. 
                          Try selecting different tokens or check if the trading pair exists.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {connection.isConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Address</span>
                        <span className="text-white font-mono text-sm">
                          {connection.address?.slice(0, 6)}...
                          {connection.address?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Network</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {connection.isCorrectNetwork
                              ? connection.networkName
                              : "Wrong Network"}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              connection.isCorrectNetwork
                                ? "bg-green-400"
                                : "bg-orange-400"
                            }`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Balance</span>
                        <span className="text-white font-medium">
                          {connection.balance}{" "}
                          {connection.isCorrectNetwork ? "BCT" : "ETH"}
                        </span>
                      </div>

                      {!connection.isCorrectNetwork && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-200 text-sm">
                              Switch to BCTChain
                            </span>
                          </div>
                          <p className="text-orange-200/80 text-xs mb-3">
                            Trading requires BCTChain network
                          </p>
                          <Button
                            onClick={switchToBCTChain}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            size="sm"
                          >
                            Switch Network
                          </Button>
                        </div>
                      )}

                      {connection.isCorrectNetwork && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-green-400 text-sm">
                            Ready to Trade
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        No wallet connected
                      </p>
                      <WalletButton className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Tokens */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Available Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {availableTokens.map((token) => (
                        <div
                          key={token.address}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {token.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">
                                {token.symbol}
                              </div>
                              <div className="text-xs text-gray-400">
                                {token.name}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {token.decimals}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-white">
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_TRANSACTIONS.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              tx.status === "success"
                                ? "bg-green-400"
                                : tx.status === "pending"
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                          />
                          <div>
                            <div className="text-white text-sm">
                              {tx.amount} {tx.fromToken} → {tx.toToken}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            tx.status === "success"
                              ? "default"
                              : tx.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
