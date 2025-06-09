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
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { WalletButton } from "./wallet-button";
import { useWallet } from "@/hooks/use-wallet";
import { TokenListService, TokenInfo, DEX_CONFIG } from "@/lib/token-list";
import { dexService } from "@/lib/dex-service";

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
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [isLoadingPools, setIsLoadingPools] = useState(false);

  // Add Liquidity State
  const [tokenA, setTokenA] = useState<TokenInfo | null>(null);
  const [tokenB, setTokenB] = useState<TokenInfo | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  // Remove Liquidity State
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [removePercentage, setRemovePercentage] = useState(25);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    "pending" | "success" | "failed" | null
  >(null);

  // Load real tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingTokens(true);
        setError(null);
        const tokenList = await TokenListService.fetchTokenList();
        setAvailableTokens(tokenList.tokens);
      } catch (error) {
        console.error("Failed to load tokens:", error);
        setError("Failed to load token list. Please refresh and try again.");
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Load real pools (this would be implemented with actual pool contract calls)
  const loadPools = async () => {
    try {
      setIsLoadingPools(true);
      setError(null);

      // In a real implementation, this would call the DEX factory contract
      // to get all pool pairs and their reserves
      // For now, we'll show an empty state since we're removing mock data

      // Example implementation:
      // const factoryContract = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      // const allPairs = await factoryContract.getAllPairs();
      // const poolData = await Promise.all(allPairs.map(async (pairAddress) => {
      //   const pairContract = new Contract(pairAddress, PAIR_ABI, provider);
      //   const reserves = await pairContract.getReserves();
      //   const token0 = await pairContract.token0();
      //   const token1 = await pairContract.token1();
      //   return { /* pool data */ };
      // }));

      setPools([]); // No mock data - will show empty state
    } catch (error) {
      console.error("Failed to load pools:", error);
      setError("Failed to load liquidity pools. Please try again.");
    } finally {
      setIsLoadingPools(false);
    }
  };

  useEffect(() => {
    if (connection && connection.chainId === DEX_CONFIG.CHAIN_ID) {
      loadPools();
    }
  }, [connection]);

  // Calculate ratio for existing pools
  useEffect(() => {
    if (tokenA && tokenB && amountA && !isCreatingPool) {
      // In a real implementation, this would fetch the current pool ratio
      // and calculate the corresponding amount of tokenB needed
      // Example:
      // const pool = pools.find(p =>
      //   (p.tokenA.address === tokenA.address && p.tokenB.address === tokenB.address) ||
      //   (p.tokenA.address === tokenB.address && p.tokenB.address === tokenA.address)
      // );
      // if (pool) {
      //   const ratio = parseFloat(pool.reserveB) / parseFloat(pool.reserveA);
      //   setAmountB((parseFloat(amountA) * ratio).toString());
      // }
    }
  }, [tokenA, tokenB, amountA, pools, isCreatingPool]);

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !connection?.address) {
      return;
    }

    try {
      setIsAddingLiquidity(true);
      setError(null);
      setTxHash(null);
      setTxStatus(null);

      // In a real implementation, this would:
      // 1. Check if pool exists
      // 2. Approve tokens if needed
      // 3. Add liquidity to the pool

      console.log("Adding liquidity:", {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        amountA,
        amountB,
        recipient: connection.address,
      });

      // Simulate transaction
      const simulatedTxHash = "0x" + Math.random().toString(16).substr(2, 64);
      setTxHash(simulatedTxHash);
      setTxStatus("pending");

      // Reset form
      setAmountA("");
      setAmountB("");

      // Simulate confirmation
      setTimeout(() => {
        setTxStatus("success");
        loadPools(); // Reload pools
      }, 3000);
    } catch (error: any) {
      console.error("Add liquidity failed:", error);
      setTxStatus("failed");
      setError(error.message || "Failed to add liquidity. Please try again.");
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPool || !connection?.address) {
      return;
    }

    try {
      setIsRemovingLiquidity(true);
      setError(null);
      setTxHash(null);
      setTxStatus(null);

      // In a real implementation, this would:
      // 1. Calculate LP tokens to burn
      // 2. Call removeLiquidity on the router

      console.log("Removing liquidity:", {
        pool: selectedPool.id,
        percentage: removePercentage,
        recipient: connection.address,
      });

      // Simulate transaction
      const simulatedTxHash = "0x" + Math.random().toString(16).substr(2, 64);
      setTxHash(simulatedTxHash);
      setTxStatus("pending");

      // Simulate confirmation
      setTimeout(() => {
        setTxStatus("success");
        loadPools(); // Reload pools
        setSelectedPool(null);
      }, 3000);
    } catch (error: any) {
      console.error("Remove liquidity failed:", error);
      setTxStatus("failed");
      setError(
        error.message || "Failed to remove liquidity. Please try again."
      );
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  const isConnectedToCorrectNetwork =
    connection?.chainId === DEX_CONFIG.CHAIN_ID;

  if (isLoadingTokens) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
              <p className="text-white">Loading tokens...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-400" />
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
                    `https://bctchain-explorer.vercel.app/tx/${txHash}`,
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

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10">
          <TabsTrigger
            value="add"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="remove"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Minus className="w-4 h-4 mr-2" />
            Remove Liquidity
          </TabsTrigger>
          <TabsTrigger
            value="pools"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
          >
            <Droplets className="w-4 h-4 mr-2" />
            All Pools
          </TabsTrigger>
        </TabsList>

        {/* Add Liquidity Tab */}
        <TabsContent value="add">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Add Liquidity</CardTitle>
              <p className="text-white/70 text-sm">
                Add tokens to a liquidity pool to earn trading fees
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Token A */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">
                  First Token
                </label>
                <div className="flex space-x-3">
                  <select
                    value={tokenA?.symbol || ""}
                    onChange={(e) => {
                      const token = availableTokens.find(
                        (t) => t.symbol === e.target.value
                      );
                      setTokenA(token || null);
                      setError(null);
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select token</option>
                    {availableTokens.map((token) => (
                      <option
                        key={token.symbol}
                        value={token.symbol}
                        className="bg-slate-800"
                      >
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amountA}
                    onChange={(e) => {
                      setAmountA(e.target.value);
                      setError(null);
                    }}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <Plus className="h-6 w-6 text-white/50" />
              </div>

              {/* Token B */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">
                  Second Token
                </label>
                <div className="flex space-x-3">
                  <select
                    value={tokenB?.symbol || ""}
                    onChange={(e) => {
                      const token = availableTokens.find(
                        (t) => t.symbol === e.target.value
                      );
                      setTokenB(token || null);
                      setError(null);
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select token</option>
                    {availableTokens.map((token) => (
                      <option
                        key={token.symbol}
                        value={token.symbol}
                        className="bg-slate-800"
                      >
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amountB}
                    onChange={(e) => {
                      setAmountB(e.target.value);
                      setError(null);
                    }}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>
              </div>

              {/* Pool Info */}
              {tokenA && tokenB && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">
                      Pool Information
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">
                    You will receive LP tokens representing your share of the{" "}
                    {tokenA.symbol}/{tokenB.symbol} pool. These tokens can be
                    used to redeem your share plus earned fees.
                  </p>
                </div>
              )}

              {/* Wallet Connection */}
              {!connection ? (
                <WalletButton className="w-full" />
              ) : !isConnectedToCorrectNetwork ? (
                <Button
                  onClick={switchToBCTChain}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Switch to BCTChain
                </Button>
              ) : (
                <Button
                  onClick={handleAddLiquidity}
                  disabled={
                    !tokenA ||
                    !tokenB ||
                    !amountA ||
                    !amountB ||
                    isAddingLiquidity
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Remove Liquidity Tab */}
        <TabsContent value="remove">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Remove Liquidity</CardTitle>
              <p className="text-white/70 text-sm">
                Remove your tokens from liquidity pools
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {pools.length === 0 ? (
                <div className="text-center py-12">
                  <Droplets className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">No liquidity positions found</p>
                  <p className="text-white/50 text-sm">
                    Add liquidity to pools to see them here
                  </p>
                </div>
              ) : (
                <>
                  {/* Pool Selection */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-sm font-medium">
                      Select Pool
                    </label>
                    <select
                      value={selectedPool?.id || ""}
                      onChange={(e) => {
                        const pool = pools.find((p) => p.id === e.target.value);
                        setSelectedPool(pool || null);
                        setError(null);
                      }}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select a pool</option>
                      {pools.map((pool) => (
                        <option
                          key={pool.id}
                          value={pool.id}
                          className="bg-slate-800"
                        >
                          {pool.tokenA.symbol}/{pool.tokenB.symbol} - Balance:{" "}
                          {pool.lpTokenBalance || "0"} LP
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPool && (
                    <>
                      {/* Percentage Slider */}
                      <div className="space-y-4">
                        <label className="text-white/70 text-sm font-medium">
                          Amount to Remove: {removePercentage}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={removePercentage}
                          onChange={(e) =>
                            setRemovePercentage(Number(e.target.value))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-white/50">
                          <span>1%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {!connection ? (
                        <WalletButton className="w-full" />
                      ) : !isConnectedToCorrectNetwork ? (
                        <Button
                          onClick={switchToBCTChain}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Switch to BCTChain
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRemoveLiquidity}
                          disabled={isRemovingLiquidity}
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50"
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
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Pools Tab */}
        <TabsContent value="pools">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">All Liquidity Pools</CardTitle>
              <p className="text-white/70 text-sm">
                Browse all available liquidity pools on BCTChain
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingPools ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
                  <p className="text-white">Loading pools...</p>
                </div>
              ) : pools.length === 0 ? (
                <div className="text-center py-12">
                  <Droplets className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">No liquidity pools found</p>
                  <p className="text-white/50 text-sm">
                    Be the first to create a pool by adding liquidity
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {pools.map((pool) => (
                      <div
                        key={pool.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex -space-x-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                {pool.tokenA.symbol[0]}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                                {pool.tokenB.symbol[0]}
                              </div>
                            </div>
                            <span className="text-white font-medium">
                              {pool.tokenA.symbol}/{pool.tokenB.symbol}
                            </span>
                          </div>
                          {pool.apy && (
                            <Badge
                              variant="outline"
                              className="border-green-500/30 text-green-400"
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {pool.apy}% APY
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-white/50">Total Liquidity</p>
                            <p className="text-white">
                              {pool.reserveA} {pool.tokenA.symbol} +{" "}
                              {pool.reserveB} {pool.tokenB.symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/50">Your Share</p>
                            <p className="text-white">
                              {pool.lpTokenBalance
                                ? `${pool.lpTokenBalance} LP`
                                : "0 LP"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Network Info */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-white/70 text-sm">Network</span>
            </div>
            <Badge variant="outline" className="border-white/20 text-white">
              BCTChain (ID: {DEX_CONFIG.CHAIN_ID})
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
