'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpDown, Wallet, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { WalletButton } from './wallet-button';
import { useWallet } from '@/hooks/use-wallet';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance?: string;
}

interface Transaction {
  id: string;
  type: 'swap' | 'liquidity' | 'bridge';
  status: 'pending' | 'success' | 'failed';
  fromToken: string;
  toToken?: string;
  amount: string;
  timestamp: number;
  hash?: string;
}

interface Quote {
  inputAmount: string;
  outputAmount: string;
  price: string;
  priceImpact: string;
  minimumReceived: string;
  gas: string;
  route: string[];
}

// Static mock data - moved outside component to prevent recreation
const MOCK_TOKENS: Token[] = [
  {
    symbol: 'BCT',
    name: 'BCT Chain Token',
    address: '0x0000000000000000000000000000000000000001',
    decimals: 18,
    balance: '1000.0'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x0000000000000000000000000000000000000002',
    decimals: 6,
    balance: '500.0'
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    address: '0x0000000000000000000000000000000000000003',
    decimals: 18,
    balance: '10.5'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x0000000000000000000000000000000000000004',
    decimals: 6,
    balance: '750.0'
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'swap',
    status: 'success',
    fromToken: 'BCT',
    toToken: 'USDC',
    amount: '100',
    timestamp: Date.now() - 300000,
    hash: '0x1234...5678'
  },
  {
    id: '2',
    type: 'liquidity',
    status: 'pending',
    fromToken: 'WETH',
    toToken: 'USDT',
    amount: '5.5',
    timestamp: Date.now() - 150000,
    hash: '0x9abc...def0'
  },
  {
    id: '3',
    type: 'swap',
    status: 'failed',
    fromToken: 'USDT',
    toToken: 'BCT',
    amount: '200',
    timestamp: Date.now() - 600000,
    hash: '0x2468...ace0'
  }
];

// Static function to prevent recreation
const generateQuote = (fromAmount: string, fromToken: Token, toToken: Token): Quote => {
  const inputAmount = parseFloat(fromAmount) || 0;
  const mockRate = Math.random() * 2 + 0.5;
  const outputAmount = inputAmount * mockRate;
  
  return {
    inputAmount: fromAmount,
    outputAmount: outputAmount.toFixed(6),
    price: mockRate.toFixed(6),
    priceImpact: (Math.random() * 2).toFixed(2),
    minimumReceived: (outputAmount * 0.995).toFixed(6),
    gas: (Math.random() * 0.01 + 0.005).toFixed(6),
    route: [fromToken.symbol, toToken.symbol]
  };
};

export function TradingInterface() {
  const { connection } = useWallet();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize tokens
  useEffect(() => {
    setFromToken(MOCK_TOKENS[0]);
    setToToken(MOCK_TOKENS[1]);
  }, []);

  // Generate quote when inputs change - removed dependencies that cause loops
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setIsLoading(true);
      
      const timer = setTimeout(() => {
        const newQuote = generateQuote(fromAmount, fromToken, toToken);
        setQuote(newQuote);
        setToAmount(newQuote.outputAmount);
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setQuote(null);
      setToAmount('');
      setIsLoading(false);
    }
  }, [fromToken, toToken, fromAmount]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !quote) return;
    
    // Reset form
    setFromAmount('');
    setToAmount('');
    setQuote(null);
    console.log('Swap executed');
  };

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
                      <h4 className="font-medium">Demo Mode</h4>
                      <p className="text-sm opacity-90 mt-1">
                        This is a preview interface with mock data. Real trading will be available when BCTChain mainnet launches.
                      </p>
                    </div>
                  </div>

                  {/* From Token */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white">From</span>
                      {fromToken?.balance && (
                        <span className="text-sm text-gray-400">
                          Balance: {fromToken.balance} {fromToken.symbol}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <select
                        className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                        value={fromToken?.symbol || ''}
                        onChange={(e) => {
                          const token = MOCK_TOKENS.find(t => t.symbol === e.target.value);
                          setFromToken(token || null);
                        }}
                      >
                        {MOCK_TOKENS.map((token) => (
                          <option key={token.symbol} value={token.symbol} className="bg-slate-800">
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
                      variant="ghost"
                      size="sm"
                      onClick={handleSwapTokens}
                      className="rounded-full p-3 bg-white/5 hover:bg-white/10 border border-white/10"
                    >
                      <ArrowUpDown className="w-4 h-4 text-white" />
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white">To</span>
                      {toToken?.balance && (
                        <span className="text-sm text-gray-400">
                          Balance: {toToken.balance} {toToken.symbol}
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <select
                        className="w-40 bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                        value={toToken?.symbol || ''}
                        onChange={(e) => {
                          const token = MOCK_TOKENS.find(t => t.symbol === e.target.value);
                          setToToken(token || null);
                        }}
                      >
                        {MOCK_TOKENS.map((token) => (
                          <option key={token.symbol} value={token.symbol} className="bg-slate-800">
                            {token.symbol}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="0.00"
                        value={isLoading ? 'Loading...' : toAmount}
                        readOnly
                        className="flex-1 bg-white/5 border-white/10 text-white text-right"
                      />
                    </div>
                  </div>

                  {/* Quote Details */}
                  {quote && (
                    <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-gray-400 text-sm">Quote Details</span>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exchange Rate</span>
                          <span className="text-white">
                            1 {fromToken?.symbol} = {quote.price} {toToken?.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price Impact</span>
                          <span className="text-green-400">{quote.priceImpact}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estimated Gas</span>
                          <span className="text-white">{quote.gas} ETH</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Swap Button or Wallet Connect */}
                  {!connection.isConnected ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm">Connect your wallet to start trading</span>
                      </div>
                      <WalletButton className="w-full h-12" />
                    </div>
                  ) : (
                    <Button
                      onClick={handleSwap}
                      disabled={!fromToken || !toToken || !fromAmount || !quote || isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-12"
                    >
                      {isLoading ? 'Getting quote...' : 
                       !fromToken || !toToken ? 'Select tokens' : 
                       !fromAmount ? 'Enter amount' : 
                       !quote ? 'Getting quote...' : 
                       `Swap ${fromToken.symbol} for ${toToken.symbol}`}
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
                          {connection.address?.slice(0, 6)}...{connection.address?.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Balance</span>
                        <span className="text-white font-medium">{connection.balance} BCT</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-green-400 text-sm">Connected</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm mb-3">No wallet connected</p>
                      <WalletButton className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_TRANSACTIONS.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            tx.status === 'success' ? 'bg-green-400' : 
                            tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <div className="text-white text-sm">
                              {tx.amount} {tx.fromToken} → {tx.toToken}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={tx.status === 'success' ? 'default' : 
                                      tx.status === 'pending' ? 'secondary' : 'destructive'}>
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
