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

      // Fetch real pools from smart contracts
      const realPools = await dexService.fetchLiquidityPools();
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

      // Create add liquidity parameters
      const addLiquidityParams: AddLiquidityParams = {
        tokenA,
        tokenB,
        amountADesired: amountA,
        amountBDesired: amountB,
        slippageTolerance: 50, // 0.5% slippage tolerance in basis points
      };

      // Execute real blockchain transaction
      const txHash = await dexService.addLiquidity(addLiquidityParams);

      setTxHash(txHash);
      setTxStatus("success");

      // Reset form
      setAmountA("");
      setAmountB("");

      // Wait for transaction confirmation and reload pools
      await dexService.waitForTransaction(txHash);
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
      const txHash = await dexService.removeLiquidity(removeLiquidityParams);

      setTxHash(txHash);
      setTxStatus("success");

      // Reset form
      setRemovePercentage("50");
      setSelectedPool(null);

      // Wait for transaction confirmation and reload pools
      await dexService.waitForTransaction(txHash);
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
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Amount B ({tokenB?.symbol || "Token B"})
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddLiquidity}
                    disabled={
                      isAddingLiquidity ||
                      !tokenA ||
                      !tokenB ||
                      !amountA ||
                      !amountB
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
              <CardTitle className="text-white flex items-center">
                <Droplets className="h-5 w-5 mr-2" />
                All Liquidity Pools
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
                  {pools.map((pool) => (
                    <div
                      key={pool.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
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
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Total Liquidity</p>
                          <p className="text-white font-medium">
                            {parseFloat(pool.reserveA).toFixed(2)}{" "}
                            {pool.tokenA.symbol} +{" "}
                            {parseFloat(pool.reserveB).toFixed(2)}{" "}
                            {pool.tokenB.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Your Position</p>
                          <p className="text-white font-medium">
                            {pool.lpTokenBalance || "0"} LP Tokens
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
