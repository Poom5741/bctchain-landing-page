"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Wallet,
  AlertCircle,
  Info,
  Droplets,
  TrendingUp,
  Minus,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { WalletButton } from "./wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { TokenListService, TokenInfo, DEX_CONFIG } from "@/lib/token-list";
import {
  dexService,
  AddLiquidityParams,
  RemoveLiquidityParams,
} from "@/lib/dex-service";

interface LiquidityPool {
  id: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  lpTokenBalance?: string;
  apy?: number;
}

export function PoolInterface() {
  const { connection, switchToBCTChain } = useWallet();
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoadingPools, setIsLoadingPools] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);

  // Add Liquidity State
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isCalculatingRatio, setIsCalculatingRatio] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<"A" | "B" | null>(
    null
  );

  // Remove Liquidity State
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [removePercentage, setRemovePercentage] = useState("50");
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);

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
          setTokenA(tokenList.tokens[0]);
          setTokenB(tokenList.tokens[1]);
        }
      } catch (err) {
        console.error("Failed to load tokens:", err);
        setError("Failed to load token list. Please refresh the page.");
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Load pools function
  const loadPools = async () => {
    try {
      setIsLoadingPools(true);
      setError(null);

      // Fetch real pools from smart contracts, pass wallet address if connected
      const realPools = await dexService.fetchLiquidityPools(
        connection.address || undefined
      );
      setPools(realPools);
    } catch (err) {
      console.error("Failed to load pools:", err);
      setError("Failed to load liquidity pools. Please try again.");
      setPools([]); // Set empty array on error
    } finally {
      setIsLoadingPools(false);
    }
  };

  // Load pools - Using real implementation
  useEffect(() => {
    if (connection.address && connection.chainId === DEX_CONFIG.CHAIN_ID) {
      loadPools();
    } else {
      setIsLoadingPools(false);
      setPools([]);
    }
  }, [connection.address, connection.chainId]);

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB) {
      setError("Please select tokens and enter amounts");
      return;
    }

    if (!connection.address) {
      setError("Please connect your wallet");
      return;
    }

    if (connection.chainId !== DEX_CONFIG.CHAIN_ID) {
      try {
        await switchToBCTChain();
      } catch (err) {
        setError("Failed to switch to BCTChain. Please switch manually.");
        return;
      }
    }

    try {
      setIsAddingLiquidity(true);
      setError(null);
      setTxStatus("pending");

      // Calculate min amounts based on slippage tolerance (0.5%)
      const slippage = 0.005;
      const amountAMin = (parseFloat(amountA) * (1 - slippage)).toString();
      const amountBMin = (parseFloat(amountB) * (1 - slippage)).toString();

      // Execute real blockchain transaction
      const txHash = await dexService.addLiquidity(
        connection.address,
        tokenA.address,
        tokenB.address,
        amountA,
        amountB,
        amountAMin,
        amountBMin,
        20 // deadline in minutes (default)
      );

      setTxHash(txHash);
      setTxStatus("success");

      // Reset form
      setAmountA("");
      setAmountB("");

      // Wait for transaction confirmation and reload pools
      if (txHash) {
        await dexService.waitForTransaction(txHash);
      }
      loadPools(); // Reload pools after successful transaction
    } catch (err: any) {
      console.error("Add liquidity failed:", err);
      setError(err?.message || "Failed to add liquidity");
      setTxStatus("failed");
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPool) {
      setError("Please select a pool");
      return;
    }

    if (!connection.address) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setIsRemovingLiquidity(true);
      setError(null);
      setTxStatus("pending");

      if (!selectedPool || !selectedPool.lpTokenBalance) {
        throw new Error("No pool selected or no LP tokens");
      }

      // Calculate liquidity amount based on percentage
      const liquidityAmount = (
        (parseFloat(selectedPool.lpTokenBalance) * parseInt(removePercentage)) /
        100
      ).toString();

      // Create remove liquidity parameters
      const removeLiquidityParams: RemoveLiquidityParams = {
        tokenA: selectedPool.tokenA,
        tokenB: selectedPool.tokenB,
        liquidity: liquidityAmount,
        slippageTolerance: 50, // 0.5% slippage tolerance in basis points
      };

      // Execute real blockchain transaction
      setTxHash(txHash);
      setTxStatus("success");

      // Reset form
      setRemovePercentage("50");
      setSelectedPool(null);

      // Wait for transaction confirmation and reload pools
      if (txHash) {
        await dexService.waitForTransaction(txHash);
      }
      loadPools(); // Reload pools after successful transaction
    } catch (err: any) {
      console.error("Remove liquidity failed:", err);
      setError(err?.message || "Failed to remove liquidity");
      setTxStatus("failed");
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  const TokenSelector = ({
    selected,
    onSelect,
    exclude,
    label,
  }: {
    selected: TokenInfo | null;
    onSelect: (token: TokenInfo) => void;
    exclude?: TokenInfo;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <ScrollArea className="h-32 border border-white/10 rounded-lg bg-white/5">
        <div className="p-2 space-y-1">
          {availableTokens
            .filter((token) => token.address !== exclude?.address)
            .map((token) => (
              <div
                key={token.address}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  selected?.address === token.address
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "hover:bg-white/5"
                }`}
                onClick={() => onSelect(token)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );

  const ErrorAlert = ({ message }: { message: string }) => (
    <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm">{message}</span>
    </div>
  );

  const TransactionStatus = () => {
    if (!txStatus) return null;

    const statusConfig = {
      pending: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: "Transaction pending...",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10 border-yellow-500/20",
      },
      success: {
        icon: <CheckCircle className="h-4 w-4" />,
        text: "Transaction successful!",
        color: "text-green-400",
        bg: "bg-green-500/10 border-green-500/20",
      },
      failed: {
        icon: <XCircle className="h-4 w-4" />,
        text: "Transaction failed",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
      },
    };

    const config = statusConfig[txStatus];

    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-lg ${config.bg}`}
      >
        <div className={`flex items-center space-x-2 ${config.color}`}>
          {config.icon}
          <span className="text-sm">{config.text}</span>
        </div>
        {txHash && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-blue-400 hover:text-blue-300"
            onClick={() =>
              window.open(`${DEX_CONFIG.EXPLORER_URL}/tx/${txHash}`, "_blank")
            }
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  // Auto-calculate Token B amount when Token A amount changes
  useEffect(() => {
    if (
      tokenA &&
      tokenB &&
      amountA &&
      parseFloat(amountA) > 0 &&
      !isAddingLiquidity &&
      lastEditedField === "A"
    ) {
      const calculateTokenBAmount = async () => {
        try {
          setIsCalculatingRatio(true);
          const calculatedAmount = await dexService.calculateLiquidityRatio(
            tokenA.address,
            tokenB.address,
            amountA,
            tokenA.decimals,
            tokenB.decimals
          );

          if (calculatedAmount) {
            setAmountB(calculatedAmount);
            setError(null);
          } else {
            // Pool doesn't exist - this would be a new pool
            setAmountB("");
            console.log("Pool doesn't exist - new pool creation");
          }
        } catch (error) {
          console.error("Error calculating token B amount:", error);
          setError("Failed to calculate token amount ratio");
        } finally {
          setIsCalculatingRatio(false);
        }
      };

      const timer = setTimeout(calculateTokenBAmount, 500); // Debounce
      return () => clearTimeout(timer);
    } else if (!amountA && lastEditedField === "A") {
      setAmountB("");
    }
  }, [tokenA, tokenB, amountA, isAddingLiquidity, lastEditedField]);

  // Auto-calculate Token A amount when Token B amount changes
  useEffect(() => {
    if (
      tokenA &&
      tokenB &&
      amountB &&
      parseFloat(amountB) > 0 &&
      !isAddingLiquidity &&
      lastEditedField === "B"
    ) {
      const calculateTokenAAmount = async () => {
        try {
          setIsCalculatingRatio(true);
          const calculatedAmount = await dexService.calculateLiquidityRatio(
            tokenB.address,
            tokenA.address,
            amountB,
            tokenB.decimals,
            tokenA.decimals
          );

          if (calculatedAmount) {
            setAmountA(calculatedAmount);
            setError(null);
          } else {
            // Pool doesn't exist - this would be a new pool
            setAmountA("");
            console.log("Pool doesn't exist - new pool creation");
          }
        } catch (error) {
          console.error("Error calculating token A amount:", error);
          setError("Failed to calculate token amount ratio");
        } finally {
          setIsCalculatingRatio(false);
        }
      };

      const timer = setTimeout(calculateTokenAAmount, 500); // Debounce
      return () => clearTimeout(timer);
    } else if (!amountB && lastEditedField === "B") {
      setAmountA("");
    }
  }, [tokenA, tokenB, amountB, isAddingLiquidity, lastEditedField]);

  if (!connection.address) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your wallet to access liquidity pools and manage your
            positions.
          </p>
          <WalletButton />
        </CardContent>
      </Card>
    );
  }

  if (connection.chainId !== DEX_CONFIG.CHAIN_ID) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Wrong Network
          </h3>
          <p className="text-gray-400 mb-6">
            Please switch to BCTChain (Chain ID: {DEX_CONFIG.CHAIN_ID}) to use
            the DEX.
          </p>
          <Button
            onClick={switchToBCTChain}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Switch to BCTChain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      {txStatus && <TransactionStatus />}

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger
            value="add"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="remove"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Minus className="h-4 w-4 mr-2" />
            Remove Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="pools"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Droplets className="h-4 w-4 mr-2" />
            All Pools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-6">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Add Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading tokens...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TokenSelector
                      selected={tokenA}
                      onSelect={setTokenA}
                      exclude={tokenB || undefined}
                      label="Token A"
                    />
                    <TokenSelector
                      selected={tokenB}
                      onSelect={setTokenB}
                      exclude={tokenA || undefined}
                      label="Token B"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Amount A ({tokenA?.symbol || "Token A"})
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amountA}
                          onChange={(e) => {
                            setAmountA(e.target.value);
                            setLastEditedField("A");
                          }}
                          className="bg-white/5 border-white/10 text-white pr-10"
                        />
                        {isCalculatingRatio && lastEditedField === "B" && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-400" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Amount B ({tokenB?.symbol || "Token B"})
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amountB}
                          onChange={(e) => {
                            setAmountB(e.target.value);
                            setLastEditedField("B");
                          }}
                          className="bg-white/5 border-white/10 text-white pr-10"
                        />
                        {isCalculatingRatio && lastEditedField === "A" && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto-calculation info */}
                  {tokenA && tokenB && (
                    <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3">
                      <div className="flex items-center text-blue-400 text-sm">
                        <Info className="h-4 w-4 mr-2" />
                        <span>
                          Amounts are automatically calculated based on current pool ratios. 
                          {!amountA && !amountB && " Enter an amount in either field to see the calculation."}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddLiquidity}
                      disabled={
                        isAddingLiquidity ||
                        !tokenA ||
                        !tokenB ||
                        !amountA ||
                        !amountB ||
                        isCalculatingRatio
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isAddingLiquidity ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding Liquidity...
                        </>
                      ) : (
                        "Add Liquidity"
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAmountA("");
                        setAmountB("");
                        setLastEditedField(null);
                        setError(null);
                      }}
                      disabled={isAddingLiquidity}
                      className="px-6 border-white/20 text-white hover:bg-white/10"
                    >
                      Clear
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remove" className="mt-6">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Minus className="h-5 w-5 mr-2" />
                Remove Liquidity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pools.length === 0 ? (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No liquidity positions found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Add liquidity to a pool first to manage your positions
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Select Pool
                    </label>
                    <ScrollArea className="h-32 border border-white/10 rounded-lg bg-white/5">
                      <div className="p-2 space-y-1">
                        {pools.map((pool) => (
                          <div
                            key={pool.id}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              selectedPool?.id === pool.id
                                ? "bg-blue-500/20 border border-blue-500/30"
                                : "hover:bg-white/5"
                            }`}
                            onClick={() => setSelectedPool(pool)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-white">
                                  {pool.tokenA.symbol}/{pool.tokenB.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  LP Balance: {pool.lpTokenBalance || "0"}
                                </div>
                              </div>
                              {pool.apy && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-500/20 text-green-400"
                                >
                                  {pool.apy.toFixed(2)}% APY
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Remove Percentage: {removePercentage}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={removePercentage}
                      onChange={(e) => setRemovePercentage(e.target.value)}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>1%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRemoveLiquidity}
                    disabled={isRemovingLiquidity || !selectedPool}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {isRemovingLiquidity ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Removing Liquidity...
                      </>
                    ) : (
                      "Remove Liquidity"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pools" className="mt-6">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2" />
                  All Liquidity Pools
                </div>
                {connection.address && (
                  <Badge variant="outline" className="text-gray-300 border-gray-500">
                    {pools.filter(p => parseFloat(p.lpTokenBalance || "0") > 0).length} positions
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Loading pools...</span>
                </div>
              ) : pools.length === 0 ? (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">
                    No liquidity pools available
                  </p>
                  <p className="text-sm text-gray-500">
                    Be the first to create a liquidity pool by adding liquidity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show user's positions first if wallet is connected */}
                  {connection.address && pools.some(p => parseFloat(p.lpTokenBalance || "0") > 0) && (
                    <>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                          <Wallet className="h-4 w-4 mr-2" />
                          Your Positions
                        </h4>
                        <div className="space-y-3">
                          {pools
                            .filter(pool => parseFloat(pool.lpTokenBalance || "0") > 0)
                            .map((pool) => (
                              <div
                                key={`user-${pool.id}`}
                                className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/20"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-white">
                                      {pool.tokenA.symbol}/{pool.tokenB.symbol}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      {pool.tokenA.name} / {pool.tokenB.name}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {pool.apy && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-500/20 text-green-400"
                                      >
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {pool.apy.toFixed(2)}% APY
                                      </Badge>
                                    )}
                                    <Badge className="bg-blue-500/20 text-blue-400">
                                      Your Position
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-400">Pool Liquidity</p>
                                    <p className="text-white font-medium">
                                      {parseFloat(pool.reserveA).toFixed(4)}{" "}
                                      {pool.tokenA.symbol}
                                    </p>
                                    <p className="text-white font-medium">
                                      {parseFloat(pool.reserveB).toFixed(4)}{" "}
                                      {pool.tokenB.symbol}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Your LP Tokens</p>
                                    <p className="text-blue-400 font-medium">
                                      {parseFloat(pool.lpTokenBalance || "0").toFixed(6)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400">Pool Share</p>
                                    <p className="text-white font-medium">
                                      {pool.totalSupply && parseFloat(pool.totalSupply) > 0
                                        ? ((parseFloat(pool.lpTokenBalance || "0") / parseFloat(pool.totalSupply)) * 100).toFixed(4)
                                        : "0"}%
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-white border-white/20 hover:bg-white/10"
                                    onClick={() => {
                                      setSelectedPool(pool);
                                      // Switch to remove liquidity tab
                                      const removeTab = document.querySelector('[value="remove"]') as HTMLElement;
                                      removeTab?.click();
                                    }}
                                  >
                                    <Minus className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-white border-white/20 hover:bg-white/10"
                                    onClick={() => {
                                      setTokenA(pool.tokenA);
                                      setTokenB(pool.tokenB);
                                      // Switch to add liquidity tab
                                      const addTab = document.querySelector('[value="add"]') as HTMLElement;
                                      addTab?.click();
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add More
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {pools.some(p => parseFloat(p.lpTokenBalance || "0") === 0) && (
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-3">
                            All Pools
                          </h4>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Show all pools or remaining pools */}
                  <div className="space-y-3">
                    {pools
                      .filter(pool => !connection.address || parseFloat(pool.lpTokenBalance || "0") === 0)
                      .map((pool) => (
                        <div
                          key={pool.id}
                          className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-white">
                                {pool.tokenA.symbol}/{pool.tokenB.symbol}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {pool.tokenA.name} / {pool.tokenB.name}
                              </p>
                            </div>
                            {pool.apy && (
                              <Badge
                                variant="secondary"
                                className="bg-green-500/20 text-green-400"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {pool.apy.toFixed(2)}% APY
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-gray-400">Pool Liquidity</p>
                              <p className="text-white font-medium">
                                {parseFloat(pool.reserveA).toFixed(4)}{" "}
                                {pool.tokenA.symbol}
                              </p>
                              <p className="text-white font-medium">
                                {parseFloat(pool.reserveB).toFixed(4)}{" "}
                                {pool.tokenB.symbol}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Total Supply</p>
                              <p className="text-white font-medium">
                                {parseFloat(pool.totalSupply || "0").toFixed(6)} LP
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setTokenA(pool.tokenA);
                              setTokenB(pool.tokenB);
                              // Switch to add liquidity tab
                              const addTab = document.querySelector('[value="add"]') as HTMLElement;
                              addTab?.click();
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Liquidity
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Network Info */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
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
