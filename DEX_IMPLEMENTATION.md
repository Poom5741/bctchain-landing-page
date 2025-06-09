# BCT DEX Implementation

This document describes the DEX (Decentralized Exchange) implementation for BCTChain, which provides a comprehensive swap interface with advanced features inspired by modern DEX platforms.

## 🌟 Features

### Core Swap Functionality

- **Token Selection**: Advanced token picker with search and filtering
- **Real-time Quotes**: Live price quotes with expiry timers
- **Slippage Control**: Configurable slippage tolerance
- **Price Impact**: Visual price impact warnings
- **Gas Estimation**: Real-time gas cost calculations
- **Multi-routing**: Support for multi-hop swaps through intermediate tokens

### Advanced Features

- **Quote Comparison**: Multiple route comparison for best prices
- **Custom Recipient**: Send tokens to different addresses
- **Transaction History**: Persistent local transaction tracking
- **Settings Panel**: Comprehensive configuration options
- **Responsive Design**: Mobile-optimized interface
- **Loading States**: Smooth UX with proper loading indicators

### User Experience

- **Tabbed Interface**: Swap, Pools, and History tabs
- **Market Overview**: Real-time token prices and 24h changes
- **Balance Display**: User token balances with quick max buttons
- **Transaction Status**: Real-time transaction monitoring
- **Error Handling**: Comprehensive error states and recovery

## 📁 File Structure

```
components/
├── trading-interface.tsx    # Main DEX interface component
lib/
├── dex-utils.ts            # DEX utility functions and mock implementations
hooks/
├── use-swap.ts             # Swap state management hook
├── use-transaction-history.ts # Transaction history management
```

## 🔧 Current Implementation (Mock)

The current implementation uses mock data and simulated contract calls. This allows for:

1. **Frontend Testing**: Complete UI/UX testing without blockchain dependency
2. **Demo Mode**: Showcase functionality to users before mainnet launch
3. **Development**: Frontend development parallel to smart contract development

### Mock Components

#### Token Management

```typescript
// Mock token list with realistic data
export const MOCK_TOKENS: Token[] = [
  {
    symbol: "sBTC",
    name: "Synthetic Bitcoin",
    address: "0x1234...",
    decimals: 8,
    price: 43250.0,
    balance: "0.12345678",
  },
  // ... more tokens
];
```

#### Price Oracle

```typescript
// Simulates real-time price feeds
export class MockPriceOracle {
  static async getPrice(tokenAddress: string): Promise<number>;
  static async getPrices(
    tokenAddresses: string[]
  ): Promise<Map<string, number>>;
}
```

#### Swap Quoter

```typescript
// Simulates DEX aggregator functionality
export class MockSwapQuoter {
  static async getQuote(params: SwapParams): Promise<SwapQuote | null>;
  static async getBestRoute(fromToken, toToken, amount): Promise<SwapRoute[]>;
}
```

#### Swap Executor

```typescript
// Simulates transaction execution
export class MockSwapExecutor {
  static async executeSwap(quote: SwapQuote): Promise<string>;
}
```

## 🚀 Integration with Real Contracts

To integrate with real Pluma chain contracts, replace the mock implementations:

### 1. Contract Integration

Replace mock contract addresses in `lib/dex-utils.ts`:

```typescript
export const DEX_CONTRACTS = {
  ROUTER: "0xYourRouterAddress",
  FACTORY: "0xYourFactoryAddress",
  QUOTER: "0xYourQuoterAddress",
  MULTICALL: "0xYourMulticallAddress",
};
```

### 2. Web3 Provider Setup

Add Web3 provider integration:

```typescript
import { ethers } from "ethers";

// Replace MockPriceOracle
export class PriceOracle {
  static async getPrice(tokenAddress: string): Promise<number> {
    const quoterContract = new ethers.Contract(
      DEX_CONTRACTS.QUOTER,
      QuoterABI,
      provider
    );
    // Real price fetching logic
  }
}
```

### 3. Real Swap Execution

Replace MockSwapExecutor:

```typescript
export class SwapExecutor {
  static async executeSwap(
    quote: SwapQuote,
    signer: ethers.Signer
  ): Promise<string> {
    const routerContract = new ethers.Contract(
      DEX_CONTRACTS.ROUTER,
      RouterABI,
      signer
    );

    const tx = await routerContract.exactInputSingle({
      tokenIn: quote.fromToken.address,
      tokenOut: quote.toToken.address,
      fee: quote.route.fees[0],
      recipient: signer.address,
      deadline: Math.floor(Date.now() / 1000) + 1200,
      amountIn: parseTokenAmount(quote.fromAmount, quote.fromToken.decimals),
      amountOutMinimum: parseTokenAmount(
        quote.minAmountOut,
        quote.toToken.decimals
      ),
      sqrtPriceLimitX96: 0,
    });

    return tx.hash;
  }
}
```

### 4. Token List Integration

Replace mock tokens with real token registry:

```typescript
// Integrate with Pluma chain token list
export async function fetchTokenList(): Promise<Token[]> {
  const response = await fetch("https://tokens.pluma.network/tokenlist.json");
  const tokenList = await response.json();
  return tokenList.tokens;
}
```

### 5. Wallet Integration

Add wallet connection:

```typescript
// hooks/use-wallet.ts
export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(
    null
  );

  const connect = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setProvider(provider);
    }
  };

  return { account, provider, connect };
}
```

## 🔄 Migration Checklist

When moving from mock to real implementation:

- [ ] Deploy DEX contracts on Pluma chain
- [ ] Update contract addresses in `DEX_CONTRACTS`
- [ ] Replace `MockPriceOracle` with real price feeds
- [ ] Replace `MockSwapQuoter` with real quoter contract calls
- [ ] Replace `MockSwapExecutor` with real transaction execution
- [ ] Add wallet connection functionality
- [ ] Integrate with real token registry
- [ ] Add proper error handling for blockchain interactions
- [ ] Implement transaction confirmation polling
- [ ] Add network switching for Pluma chain
- [ ] Set up proper RPC endpoints

## 🎨 Customization

### Theme & Styling

The interface uses Tailwind CSS and follows the existing BCTChain design system:

- Dark theme with purple/blue gradients
- Glass morphism effects with backdrop blur
- Consistent spacing and typography
- Responsive design patterns

### Feature Toggles

Easily enable/disable features by modifying the main component:

- Pool functionality (currently disabled)
- Advanced routing options
- Transaction history persistence
- Custom recipient addresses

### Token Configuration

Modify `MOCK_TOKENS` array to add/remove supported tokens:

- Add new synthetic assets
- Configure decimals and pricing
- Set up token logos and metadata

## 🧪 Testing

### Mock Data Testing

The current implementation allows comprehensive testing with:

- Realistic price fluctuations
- Transaction success/failure scenarios
- Network delay simulations
- Gas price variations

### Integration Testing

When integrating real contracts:

1. Test on testnet first
2. Verify all contract interactions
3. Test edge cases (failed transactions, network issues)
4. Validate gas estimations
5. Test with different wallet providers

## 📊 Performance Considerations

- **Debounced Quotes**: Quotes are fetched with 500ms debounce
- **Local Storage**: Transaction history persisted locally
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Boundaries**: Proper error handling prevents crashes
- **Loading States**: Smooth loading indicators prevent user confusion

## 🔐 Security Considerations

- Input validation for all user inputs
- Address validation for custom recipients
- Slippage protection with warnings
- Transaction simulation before execution
- Proper error handling for failed transactions

## 🚀 Future Enhancements

Planned features for future releases:

- **Liquidity Pools**: Add/remove liquidity functionality
- **Yield Farming**: Staking and rewards system
- **Limit Orders**: Advanced order types
- **Portfolio Tracking**: P&L tracking and analytics
- **Mobile App**: React Native implementation
- **Advanced Charts**: TradingView integration
- **Multi-chain**: Cross-chain swapping capabilities

---

This DEX implementation provides a solid foundation for BCTChain's trading interface while maintaining flexibility for future enhancements and real contract integration.
