"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpDown,
  AlertCircle,
  Info,
  ExternalLink,
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
      setTxHash(null);
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

      // Execute real swap transaction
      const txHash = await dexService.executeSwap(swapParams);

      if (txHash) {
        setTxHash(txHash);
        // Reset form after successful transaction submission
        setFromAmount("");
        setToAmount("");
        setQuote(null);

        console.log("Swap transaction submitted successfully!");
        console.log("Transaction hash:", txHash);
      }
    } catch (error: any) {
      console.error("Swap failed:", error);

      // Handle specific error types
      if (error.code === 4001) {
        console.log("User rejected the transaction");
      } else if (error.message?.includes("insufficient funds")) {
        console.log("Insufficient funds for transaction");
      } else if (error.message?.includes("User denied")) {
        console.log("User denied transaction signature");
      } else {
        console.log("Transaction failed:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingTokens) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading tokens...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
    name: "Synthetic Ethereum",
    price: 2680.0,
    change: "+1.8%",
    logo: "Ξ",
    decimals: 18,
    chainId: 1,
    balance: "2.5647891",
  },
  {
    symbol: "sUSD",
    name: "Synthetic USD",
    price: 1.0,
    change: "0.0%",
    logo: "$",
    decimals: 18,
    chainId: 1,
    balance: "1000.00",
  },
  {
    symbol: "sGOLD",
    name: "Synthetic Gold",
    price: 2045.0,
    change: "+0.7%",
    logo: "Au",
    decimals: 18,
    chainId: 1,
    balance: "5.2341",
  },
  {
    symbol: "sOIL",
    name: "Synthetic Oil",
    price: 78.5,
    change: "-1.2%",
    logo: "🛢",
    decimals: 18,
    chainId: 1,
    balance: "15.789",
  },
  {
    symbol: "sSPX",
    name: "Synthetic S&P 500",
    price: 4567.0,
    change: "+0.9%",
    logo: "📈",
    decimals: 18,
    chainId: 1,
    balance: "0.8745",
  },
];

// Mock transaction history - moved outside component
const getMockTransactions = (): Transaction[] => [
  {
    id: "1",
    fromToken: "sBTC",
    toToken: "sETH",
    fromAmount: "0.1",
    toAmount: "1.612",
    status: "completed",
    timestamp: Date.now() - 300000,
    hash: "0x1234...5678",
  },
  {
    id: "2",
    fromToken: "sUSD",
    toToken: "sBTC",
    fromAmount: "1000",
    toAmount: "0.0231",
    status: "completed",
    timestamp: Date.now() - 600000,
    hash: "0x9876...4321",
  },
  {
    id: "3",
    fromToken: "sETH",
    toToken: "sGOLD",
    fromAmount: "1.5",
    toAmount: "1.967",
    status: "pending",
    timestamp: Date.now() - 120000,
  },
];

export function TradingInterface() {
  const { connection } = useWallet();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<SwapQuote | null>(null);
  const [quoteExpiry, setQuoteExpiry] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState<"from" | "to" | null>(
    null
  );
  const [tokenSearchTerm, setTokenSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize with default tokens
    const defaultTokens = getMockTokens();
    setFromToken(defaultTokens[0]);
    setToToken(defaultTokens[1]);
    // Load mock transactions
    setTransactions(getMockTransactions());
  }, []);

  // Generate mock quote
  const generateMockQuote = useCallback(
    (from: Token, to: Token, amount: string): SwapQuote | null => {
      if (!amount || isNaN(parseFloat(amount))) return null;

      const fromAmountNum = parseFloat(amount);
      const rate = from.price / to.price;
      const toAmountNum = fromAmountNum * rate;

      // Add some randomness for realism
      const priceImpact = Math.random() * 0.5; // 0-0.5%
      const adjustedToAmount = toAmountNum * (1 - priceImpact / 100);

      return {
        fromAmount: amount,
        toAmount: adjustedToAmount.toFixed(6),
        priceImpact,
        fee: 0.1, // 0.1% fee
        route: [from.symbol, to.symbol],
        estimatedGas: "0.002",
        expiresAt: Date.now() + 30000, // 30 seconds
      };
    },
    []
  );

  // Quote refresh effect
  useEffect(() => {
    if (fromToken && toToken && fromAmount && mounted) {
      setIsLoadingQuote(true);
      const timer = setTimeout(() => {
        const quote = generateMockQuote(fromToken, toToken, fromAmount);
        setCurrentQuote(quote);
        setQuoteExpiry(quote ? quote.expiresAt : 0);
        if (quote) {
          setToAmount(quote.toAmount);
        }
        setIsLoadingQuote(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [fromToken, toToken, fromAmount, mounted]);

  // Quote expiry countdown
  useEffect(() => {
    if (quoteExpiry > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= quoteExpiry) {
          setCurrentQuote(null);
          setQuoteExpiry(0);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quoteExpiry]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !currentQuote) return;

    setIsSwapping(true);

    try {
      // Simulate swap transaction
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Add to transaction history
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: fromAmount,
        toAmount: toAmount,
        status: Math.random() > 0.1 ? "completed" : "failed", // 90% success rate
        timestamp: Date.now(),
        hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random()
          .toString(16)
          .substr(2, 4)}`,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      // Reset form
      setFromAmount("");
      setToAmount("");
      setCurrentQuote(null);
      setQuoteExpiry(0);
    } catch (error) {
      console.error("Swap failed:", error);
    } finally {
      setIsSwapping(false);
    }
  };

  const filteredTokens = getMockTokens().filter(
    (token) =>
      token.symbol.toLowerCase().includes(tokenSearchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(tokenSearchTerm.toLowerCase())
  );

  const getQuoteTimeRemaining = () => {
    if (!quoteExpiry) return 0;
    const remaining = Math.max(0, quoteExpiry - Date.now());
    return Math.ceil(remaining / 1000);
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num < 0.001) return num.toFixed(8);
    if (num < 1) return num.toFixed(6);
    return num.toFixed(4);
  };

  if (!mounted) {
    return (
      <div className="min-h-[600px] animate-pulse bg-white/5 rounded-xl" />
    );
  }

  return (
    <TooltipProvider>
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
              <h2 className="text-4xl font-bold text-white mb-4">
                BCT DEX - Advanced Trading
              </h2>
              <p className="text-gray-400 text-lg">
                Trade synthetic assets with zero slippage and deep liquidity
              </p>
            </div>

            <Tabs defaultValue="swap" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="swap">Swap</TabsTrigger>
                <TabsTrigger value="pools">Pools</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="swap">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Swap Interface */}
                  <div className="lg:col-span-2">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-white flex items-center">
                          <ArrowUpDown className="w-5 h-5 mr-2" />
                          Swap Assets
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSettings(true)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Demo Mode Warning */}
                        <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-200 flex items-start space-x-3">
                          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">Demo Mode</h4>
                            <p className="text-sm opacity-90 mt-1">
                              This is a preview interface with mock data. Real
                              trading will be available when BCTChain mainnet
                              launches.
                            </p>
                          </div>
                        </div>

                        {/* From Token */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-white">From</Label>
                            {fromToken?.balance && (
                              <span className="text-sm text-gray-400">
                                Balance: {formatBalance(fromToken.balance)}{" "}
                                {fromToken.symbol}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <div className="flex space-x-2">
                              <Dialog
                                open={showTokenSelect === "from"}
                                onOpenChange={(open) =>
                                  setShowTokenSelect(open ? "from" : null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-40 bg-white/5 border-white/10 text-white justify-between"
                                  >
                                    {fromToken ? (
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg">
                                          {fromToken.logo}
                                        </span>
                                        <span>{fromToken.symbol}</span>
                                      </div>
                                    ) : (
                                      "Select token"
                                    )}
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <TokenSelectDialog
                                  tokens={filteredTokens}
                                  selectedToken={fromToken}
                                  onSelect={(token) => {
                                    setFromToken(token);
                                    setShowTokenSelect(null);
                                  }}
                                  searchTerm={tokenSearchTerm}
                                  onSearchChange={setTokenSearchTerm}
                                />
                              </Dialog>
                              <div className="flex-1 relative">
                                <Input
                                  placeholder="0.00"
                                  value={fromAmount}
                                  onChange={(e) =>
                                    setFromAmount(e.target.value)
                                  }
                                  className="bg-white/5 border-white/10 text-white text-right text-lg pr-16"
                                  type="number"
                                  step="any"
                                  min="0"
                                />
                                {fromToken?.balance && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                                      onClick={() =>
                                        setFromAmount(
                                          (
                                            parseFloat(fromToken.balance!) * 0.5
                                          ).toString()
                                        )
                                      }
                                    >
                                      50%
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                                      onClick={() =>
                                        setFromAmount(fromToken.balance!)
                                      }
                                    >
                                      MAX
                                    </Button>
                                  </div>
                                )}
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
                            {toToken?.balance && (
                              <span className="text-sm text-gray-400">
                                Balance: {formatBalance(toToken.balance)}{" "}
                                {toToken.symbol}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Dialog
                              open={showTokenSelect === "to"}
                              onOpenChange={(open) =>
                                setShowTokenSelect(open ? "to" : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-40 bg-white/5 border-white/10 text-white justify-between"
                                >
                                  {toToken ? (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {toToken.logo}
                                      </span>
                                      <span>{toToken.symbol}</span>
                                    </div>
                                  ) : (
                                    "Select token"
                                  )}
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <TokenSelectDialog
                                tokens={filteredTokens}
                                selectedToken={toToken}
                                onSelect={(token) => {
                                  setToToken(token);
                                  setShowTokenSelect(null);
                                }}
                                searchTerm={tokenSearchTerm}
                                onSearchChange={setTokenSearchTerm}
                              />
                            </Dialog>
                            <div className="flex-1 relative">
                              <Input
                                placeholder="0.00"
                                value={isLoadingQuote ? "Loading..." : toAmount}
                                readOnly
                                className="bg-white/5 border-white/10 text-white text-right text-lg"
                              />
                              {isLoadingQuote && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quote Details */}
                        {currentQuote && (
                          <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">
                                Quote Details
                              </span>
                              <div className="flex items-center space-x-2">
                                {getQuoteTimeRemaining() > 0 ? (
                                  <div className="flex items-center space-x-1 text-xs text-orange-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{getQuoteTimeRemaining()}s</span>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const quote = generateMockQuote(
                                        fromToken!,
                                        toToken!,
                                        fromAmount
                                      );
                                      setCurrentQuote(quote);
                                      if (quote) {
                                        setQuoteExpiry(quote.expiresAt);
                                        setToAmount(quote.toAmount);
                                      }
                                    }}
                                    className="text-blue-400 hover:text-blue-300 h-6 px-2"
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Refresh
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Exchange Rate
                                </span>
                                <span className="text-white">
                                  1 {fromToken?.symbol} ={" "}
                                  {(
                                    parseFloat(currentQuote.toAmount) /
                                    parseFloat(currentQuote.fromAmount)
                                  ).toFixed(6)}{" "}
                                  {toToken?.symbol}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Price Impact
                                </span>
                                <span
                                  className={
                                    currentQuote.priceImpact > 1
                                      ? "text-red-400"
                                      : "text-green-400"
                                  }
                                >
                                  {currentQuote.priceImpact.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Fee</span>
                                <span className="text-white">
                                  {currentQuote.fee}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Estimated Gas
                                </span>
                                <span className="text-white">
                                  {currentQuote.estimatedGas} ETH
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">
                                  Slippage Tolerance
                                </span>
                                <span className="text-white">{slippage}%</span>
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
                        ) : (
                          <Button
                            onClick={handleSwap}
                            disabled={
                              !fromToken ||
                              !toToken ||
                              !fromAmount ||
                              !currentQuote ||
                              isSwapping ||
                              getQuoteTimeRemaining() === 0
                            }
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12"
                          >
                            {isSwapping ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Swapping...
                              </>
                            ) : !fromToken || !toToken ? (
                              "Select tokens"
                            ) : !fromAmount ? (
                              "Enter amount"
                            ) : !currentQuote ? (
                              "Getting quote..."
                            ) : getQuoteTimeRemaining() === 0 ? (
                              "Quote expired - Refresh"
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
                  </div>

                  {/* Wallet Status & Market Overview Sidebar */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Wallet Status */}
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
                              <span className="text-sm text-gray-400">
                                Address
                              </span>
                              <span className="text-white font-mono text-sm">
                                {connection.address?.slice(0, 6)}...
                                {connection.address?.slice(-4)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">
                                Balance
                              </span>
                              <span className="text-white font-medium">
                                {connection.balance} BCT
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              <span className="text-green-400 text-sm">
                                Connected
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-500/20 flex items-center justify-center">
                              <Wallet className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-400 text-sm mb-3">
                              No wallet connected
                            </p>
                            <WalletButton
                              variant="compact"
                              className="w-full"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Market Overview */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl h-fit">
                      <CardHeader>
                        <CardTitle className="text-white">
                          Market Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96">
                          <div className="space-y-3">
                            {getMockTokens().map((token) => (
                              <div
                                key={token.symbol}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                                onClick={() => {
                                  if (!fromToken) {
                                    setFromToken(token);
                                  } else if (!toToken) {
                                    setToToken(token);
                                  } else {
                                    setFromToken(token);
                                  }
                                }}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">{token.logo}</span>
                                  <div>
                                    <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                                      {token.symbol}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {token.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-white text-sm">
                                    ${token.price.toLocaleString()}
                                  </div>
                                  <div className="flex items-center text-xs">
                                    {token.change.startsWith("+") ? (
                                      <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                                    ) : token.change.startsWith("-") ? (
                                      <TrendingDown className="w-3 h-3 mr-1 text-red-400" />
                                    ) : (
                                      <div className="w-3 h-3 mr-1" />
                                    )}
                                    <span
                                      className={
                                        token.change.startsWith("+")
                                          ? "text-green-400"
                                          : token.change.startsWith("-")
                                          ? "text-red-400"
                                          : "text-gray-400"
                                      }
                                    >
                                      {token.change}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                          <h4 className="font-medium text-white mb-2 flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            BCT DEX Benefits
                          </h4>
                          <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Zero slippage trading</li>
                            <li>• 24/7 market access</li>
                            <li>• No counterparty risk</li>
                            <li>• Instant settlement</li>
                            <li>• Advanced routing</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pools">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Liquidity Pools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🚧</div>
                      <h3 className="text-xl font-medium text-white mb-2">
                        Coming Soon
                      </h3>
                      <p className="text-gray-400">
                        Liquidity pools and yield farming will be available in
                        the next update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <History className="w-5 h-5 mr-2" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📄</div>
                          <p className="text-gray-400">No transactions yet</p>
                        </div>
                      ) : (
                        transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  tx.status === "completed"
                                    ? "bg-green-400"
                                    : tx.status === "pending"
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                                }`}
                              />
                              <div>
                                <div className="text-white font-medium">
                                  {tx.fromAmount} {tx.fromToken} → {tx.toAmount}{" "}
                                  {tx.toToken}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  tx.status === "completed"
                                    ? "default"
                                    : tx.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="mb-1"
                              >
                                {tx.status}
                              </Badge>
                              {tx.hash && (
                                <div className="text-xs text-gray-400 font-mono">
                                  {tx.hash}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Settings Dialog */}
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          slippage={slippage}
          onSlippageChange={setSlippage}
          customSlippage={customSlippage}
          onCustomSlippageChange={setCustomSlippage}
          useCustomRecipient={useCustomRecipient}
          onUseCustomRecipientChange={setUseCustomRecipient}
          recipientAddress={recipientAddress}
          onRecipientAddressChange={setRecipientAddress}
        />
      </section>
    </TooltipProvider>
  );
}

// Token Selection Dialog Component
function TokenSelectDialog({
  tokens,
  selectedToken,
  onSelect,
  searchTerm,
  onSearchChange,
}: {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  return (
    <DialogContent className="bg-slate-900 border-white/10">
      <DialogHeader>
        <DialogTitle className="text-white">Select a token</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tokens..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.symbol}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedToken?.symbol === token.symbol
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                }`}
                onClick={() => onSelect(token)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{token.logo}</span>
                  <div>
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">
                    ${token.price.toLocaleString()}
                  </div>
                  {token.balance && (
                    <div className="text-sm text-gray-400">
                      {parseFloat(token.balance).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  );
}

// Settings Dialog Component
function SettingsDialog({
  open,
  onOpenChange,
  slippage,
  onSlippageChange,
  customSlippage,
  onCustomSlippageChange,
  useCustomRecipient,
  onUseCustomRecipientChange,
  recipientAddress,
  onRecipientAddressChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slippage: number;
  onSlippageChange: (value: number) => void;
  customSlippage: string;
  onCustomSlippageChange: (value: string) => void;
  useCustomRecipient: boolean;
  onUseCustomRecipientChange: (value: boolean) => void;
  recipientAddress: string;
  onRecipientAddressChange: (value: string) => void;
}) {
  const handleSlippageChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue);
      onCustomSlippageChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Swap Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Slippage Tolerance */}
          <div className="space-y-3">
            <Label className="text-white">Slippage Tolerance</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSlippageChange(value)}
                  className={
                    slippage === value
                      ? ""
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }
                >
                  {value}%
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => {
                  onCustomSlippageChange(e.target.value);
                  handleSlippageChange(e.target.value);
                }}
                className="bg-white/5 border-white/10 text-white"
                type="number"
                step="0.1"
                min="0"
                max="50"
              />
              <span className="text-white">%</span>
            </div>
          </div>

          {/* Custom Recipient */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Custom Recipient</Label>
              <Switch
                checked={useCustomRecipient}
                onCheckedChange={onUseCustomRecipientChange}
              />
            </div>
            {useCustomRecipient && (
              <Input
                placeholder="0x... recipient address"
                value={recipientAddress}
                onChange={(e) => onRecipientAddressChange(e.target.value)}
                className="bg-white/5 border-white/10 text-white font-mono"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
