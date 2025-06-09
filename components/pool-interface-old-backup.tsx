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

// Mock pools for display
const MOCK_POOLS: LiquidityPool[] = [
  {
    id: "1",
    tokenA: {
      symbol: "BCT",
      name: "BCT Token",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      chainId: 1190,
    },
    tokenB: {
      symbol: "USDG",
      name: "USD Gold",
      address: "0x1234567890123456789012345678901234567890",
      decimals: 18,
      chainId: 1190,
    },
    reserveA: "1250.5",
    reserveB: "3125000.0",
    totalSupply: "5.5",
    lpTokenBalance: "0.125",
    apy: 15.4,
  },
  {
    id: "2",
    tokenA: {
      symbol: "RAJ",
      name: "RAJ Token",
      address: "0x2345678901234567890123456789012345678901",
      decimals: 18,
      chainId: 1190,
    },
    tokenB: {
      symbol: "LISA",
      name: "LISA Token",
      address: "0x3456789012345678901234567890123456789012",
      decimals: 18,
      chainId: 1190,
    },
    reserveA: "850.0",
    reserveB: "2125.0",
    totalSupply: "2.8",
    lpTokenBalance: "0.08",
    apy: 22.1,
  },
];

export function PoolInterface() {
  const { connection, switchToBCTChain } = useWallet();
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

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

  const [pools, setPools] = useState<LiquidityPool[]>(MOCK_POOLS);

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingTokens(true);
        const tokenList = await TokenListService.fetchTokenList();
        setAvailableTokens(tokenList.tokens);

        // Set default tokens
        if (tokenList.tokens.length >= 2) {
          setTokenA(tokenList.tokens[0]);
          setTokenB(tokenList.tokens[1]);
        }
      } catch (error) {
        console.error("Failed to load tokens:", error);
        setAvailableTokens([]);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, []);

  // Calculate equivalent amount when tokenA amount changes
  useEffect(() => {
    if (tokenA && tokenB && amountA && parseFloat(amountA) > 0) {
      // Find existing pool to get the ratio
      const existingPool = pools.find(
        (pool) =>
          (pool.tokenA.symbol === tokenA.symbol &&
            pool.tokenB.symbol === tokenB.symbol) ||
          (pool.tokenA.symbol === tokenB.symbol &&
            pool.tokenB.symbol === tokenA.symbol)
      );

      if (existingPool) {
        let ratio: number;
        if (existingPool.tokenA.symbol === tokenA.symbol) {
          ratio =
            parseFloat(existingPool.reserveB) /
            parseFloat(existingPool.reserveA);
        } else {
          ratio =
            parseFloat(existingPool.reserveA) /
            parseFloat(existingPool.reserveB);
        }
        const calculatedAmountB = (parseFloat(amountA) * ratio).toFixed(6);
        setAmountB(calculatedAmountB);
      } else {
        // New pool - user sets both amounts
        // setAmountB("");
      }
    }
  }, [tokenA, tokenB, amountA, pools]);

  const handleCreatePool = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !connection?.address)
      return;

    try {
      setIsCreatingPool(true);
      console.log("Creating new liquidity pool...");

      // This would call the actual pool creation function
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add to mock pools
      const newPool: LiquidityPool = {
        id: Date.now().toString(),
        tokenA,
        tokenB,
        reserveA: amountA,
        reserveB: amountB,
        totalSupply: "1.0",
        lpTokenBalance: "1.0",
        apy: 0,
      };

      setPools([...pools, newPool]);

      // Reset form
      setAmountA("");
      setAmountB("");

      console.log("Pool created successfully!");
    } catch (error) {
      console.error("Failed to create pool:", error);
    } finally {
      setIsCreatingPool(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB || !connection?.address)
      return;

    try {
      setIsAddingLiquidity(true);
      console.log("Adding liquidity to pool...");

      // This would call the actual add liquidity function
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form
      setAmountA("");
      setAmountB("");

      console.log("Liquidity added successfully!");
    } catch (error) {
      console.error("Failed to add liquidity:", error);
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!selectedPool || !connection?.address) return;

    try {
      setIsRemovingLiquidity(true);
      console.log(`Removing ${removePercentage}% liquidity from pool...`);

      // This would call the actual remove liquidity function
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Liquidity removed successfully!");
    } catch (error) {
      console.error("Failed to remove liquidity:", error);
    } finally {
      setIsRemovingLiquidity(false);
    }
  };

  const isNewPool =
    tokenA &&
    tokenB &&
    !pools.find(
      (pool) =>
        (pool.tokenA.symbol === tokenA.symbol &&
          pool.tokenB.symbol === tokenB.symbol) ||
        (pool.tokenA.symbol === tokenB.symbol &&
          pool.tokenB.symbol === tokenA.symbol)
    );

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              BCT DEX - Liquidity Pools
            </h2>
            <p className="text-gray-400 text-lg">
              Provide liquidity and earn fees from trading pairs
            </p>
          </div>

          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="add" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Liquidity</span>
              </TabsTrigger>
              <TabsTrigger
                value="remove"
                className="flex items-center space-x-2"
              >
                <Minus className="w-4 h-4" />
                <span>Remove Liquidity</span>
              </TabsTrigger>
              <TabsTrigger
                value="pools"
                className="flex items-center space-x-2"
              >
                <Droplets className="w-4 h-4" />
                <span>All Pools</span>
              </TabsTrigger>
            </TabsList>

            {/* Add Liquidity Tab */}
            <TabsContent value="add">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        {isNewPool ? "Create New Pool" : "Add Liquidity"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isNewPool && (
                        <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-200 flex items-start space-x-3">
                          <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">Creating New Pool</h4>
                            <p className="text-sm opacity-90 mt-1">
                              You are the first liquidity provider for this{" "}
                              {tokenA?.symbol}/{tokenB?.symbol} pair. You can
                              set the initial price by depositing tokens at your
                              desired ratio.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Token A Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white">Token A</span>
                          <span className="text-sm text-gray-400">
                            Balance: 0.00
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <select
                            className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                            value={tokenA?.symbol || ""}
                            onChange={(e) => {
                              const token = availableTokens.find(
                                (t: TokenInfo) => t.symbol === e.target.value
                              );
                              setTokenA(token || null);
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
                            value={amountA}
                            onChange={(e) => setAmountA(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-right"
                            type="number"
                            step="any"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Plus Icon */}
                      <div className="flex justify-center">
                        <div className="rounded-full p-3 bg-white/5 border border-white/10">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Token B Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white">Token B</span>
                          <span className="text-sm text-gray-400">
                            Balance: 0.00
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <select
                            className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                            value={tokenB?.symbol || ""}
                            onChange={(e) => {
                              const token = availableTokens.find(
                                (t: TokenInfo) => t.symbol === e.target.value
                              );
                              setTokenB(token || null);
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
                                disabled={token.symbol === tokenA?.symbol}
                              >
                                {token.symbol}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="0.00"
                            value={amountB}
                            onChange={(e) => setAmountB(e.target.value)}
                            className="flex-1 bg-white/5 border-white/10 text-white text-right"
                            type="number"
                            step="any"
                            min="0"
                            readOnly={!isNewPool}
                          />
                        </div>
                      </div>

                      {/* Pool Details */}
                      {tokenA && tokenB && amountA && amountB && (
                        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                          <span className="text-gray-400 text-sm">
                            Pool Details
                          </span>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Pool Pair</span>
                              <span className="text-white">
                                {tokenA.symbol}/{tokenB.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Share of Pool
                              </span>
                              <span className="text-white">
                                {isNewPool ? "100%" : "~0.1%"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                Expected LP Tokens
                              </span>
                              <span className="text-white">
                                {isNewPool
                                  ? Math.sqrt(
                                      parseFloat(amountA) * parseFloat(amountB)
                                    ).toFixed(6)
                                  : "~0.05"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {!connection.isConnected ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 flex items-center space-x-2">
                            <Wallet className="w-4 h-4" />
                            <span className="text-sm">
                              Connect your wallet to provide liquidity
                            </span>
                          </div>
                          <WalletButton className="w-full h-12" />
                        </div>
                      ) : !connection.isCorrectNetwork ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-200 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                              Switch to BCTChain network
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
                          onClick={
                            isNewPool ? handleCreatePool : handleAddLiquidity
                          }
                          disabled={
                            !tokenA ||
                            !tokenB ||
                            !amountA ||
                            !amountB ||
                            isCreatingPool ||
                            isAddingLiquidity ||
                            tokenA.symbol === tokenB.symbol
                          }
                          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white border-0 h-12 disabled:opacity-50"
                        >
                          {isCreatingPool || isAddingLiquidity
                            ? isNewPool
                              ? "Creating Pool..."
                              : "Adding Liquidity..."
                            : !tokenA || !tokenB
                            ? "Select tokens"
                            : tokenA.symbol === tokenB.symbol
                            ? "Select different tokens"
                            : !amountA || !amountB
                            ? "Enter amounts"
                            : isNewPool
                            ? `Create ${tokenA.symbol}/${tokenB.symbol} Pool`
                            : `Add Liquidity to ${tokenA.symbol}/${tokenB.symbol}`}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Droplets className="w-4 h-4 mr-2" />
                        Your Liquidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {connection.isConnected ? (
                          <>
                            <div className="text-center py-4">
                              <div className="text-2xl font-bold text-white mb-2">
                                $0.00
                              </div>
                              <p className="text-gray-400 text-sm">
                                Total Liquidity Value
                              </p>
                            </div>
                            <div className="space-y-2">
                              {pools
                                .filter(
                                  (pool) =>
                                    pool.lpTokenBalance &&
                                    parseFloat(pool.lpTokenBalance) > 0
                                )
                                .map((pool) => (
                                  <div
                                    key={pool.id}
                                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-white font-medium">
                                        {pool.tokenA.symbol}/
                                        {pool.tokenB.symbol}
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {pool.apy}% APY
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      LP Tokens: {pool.lpTokenBalance}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400 text-sm">
                              Connect wallet to view your liquidity positions
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Remove Liquidity Tab */}
            <TabsContent value="remove">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Minus className="w-5 h-5 mr-2" />
                        Remove Liquidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Pool Selection */}
                      <div className="space-y-2">
                        <label className="text-white">Select Pool</label>
                        <select
                          className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                          value={selectedPool?.id || ""}
                          onChange={(e) => {
                            const pool = pools.find(
                              (p) => p.id === e.target.value
                            );
                            setSelectedPool(pool || null);
                          }}
                        >
                          <option value="" className="bg-slate-800">
                            Select a pool
                          </option>
                          {pools
                            .filter(
                              (pool) =>
                                pool.lpTokenBalance &&
                                parseFloat(pool.lpTokenBalance) > 0
                            )
                            .map((pool) => (
                              <option
                                key={pool.id}
                                value={pool.id}
                                className="bg-slate-800"
                              >
                                {pool.tokenA.symbol}/{pool.tokenB.symbol} -{" "}
                                {pool.lpTokenBalance} LP
                              </option>
                            ))}
                        </select>
                      </div>

                      {selectedPool && (
                        <>
                          {/* Percentage Slider */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-white">
                                Amount to Remove
                              </label>
                              <span className="text-white font-bold">
                                {removePercentage}%
                              </span>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={removePercentage}
                                onChange={(e) =>
                                  setRemovePercentage(parseInt(e.target.value))
                                }
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-400">
                                <button
                                  onClick={() => setRemovePercentage(25)}
                                  className="hover:text-white"
                                >
                                  25%
                                </button>
                                <button
                                  onClick={() => setRemovePercentage(50)}
                                  className="hover:text-white"
                                >
                                  50%
                                </button>
                                <button
                                  onClick={() => setRemovePercentage(75)}
                                  className="hover:text-white"
                                >
                                  75%
                                </button>
                                <button
                                  onClick={() => setRemovePercentage(100)}
                                  className="hover:text-white"
                                >
                                  MAX
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm">
                              You will receive
                            </span>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-white">
                                  {selectedPool.tokenA.symbol}
                                </span>
                                <span className="text-white font-medium">
                                  {(
                                    (((parseFloat(selectedPool.reserveA) *
                                      parseFloat(
                                        selectedPool.lpTokenBalance || "0"
                                      )) /
                                      parseFloat(selectedPool.totalSupply)) *
                                      removePercentage) /
                                    100
                                  ).toFixed(6)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-white">
                                  {selectedPool.tokenB.symbol}
                                </span>
                                <span className="text-white font-medium">
                                  {(
                                    (((parseFloat(selectedPool.reserveB) *
                                      parseFloat(
                                        selectedPool.lpTokenBalance || "0"
                                      )) /
                                      parseFloat(selectedPool.totalSupply)) *
                                      removePercentage) /
                                    100
                                  ).toFixed(6)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          {!connection.isConnected ? (
                            <WalletButton className="w-full h-12" />
                          ) : !connection.isCorrectNetwork ? (
                            <Button
                              type="button"
                              onClick={switchToBCTChain}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                            >
                              Switch to BCTChain Network
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={handleRemoveLiquidity}
                              disabled={isRemovingLiquidity}
                              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 h-12 disabled:opacity-50"
                            >
                              {isRemovingLiquidity
                                ? "Removing Liquidity..."
                                : `Remove ${removePercentage}% Liquidity`}
                            </Button>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar for Remove */}
                <div className="lg:col-span-1">
                  <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Position Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPool ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pool Share</span>
                            <span className="text-white">
                              {(
                                (parseFloat(
                                  selectedPool.lpTokenBalance || "0"
                                ) /
                                  parseFloat(selectedPool.totalSupply)) *
                                100
                              ).toFixed(4)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">LP Tokens</span>
                            <span className="text-white">
                              {selectedPool.lpTokenBalance}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">APY</span>
                            <span className="text-green-400">
                              {selectedPool.apy}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Select a pool to view details
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* All Pools Tab */}
            <TabsContent value="pools">
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">
                    All Liquidity Pools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pools.map((pool) => (
                      <div
                        key={pool.id}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {pool.tokenA.symbol.charAt(0)}
                                </span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center -ml-2">
                                <span className="text-white text-xs font-bold">
                                  {pool.tokenB.symbol.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-white font-medium">
                                {pool.tokenA.symbol}/{pool.tokenB.symbol}
                              </div>
                              <div className="text-xs text-gray-400">
                                TVL: $
                                {(
                                  parseFloat(pool.reserveA) * 2500 +
                                  parseFloat(pool.reserveB)
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-white font-medium">
                                {pool.apy}% APY
                              </div>
                              <div className="text-xs text-gray-400">
                                24h Volume: $45,678
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {pool.totalSupply} LP
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
