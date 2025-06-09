const { ethers } = require('ethers');

// Your LP token address
const LP_TOKEN_ADDRESS = '0x2A2A5695020F9D5a047a1D20658A47135a96b1A7';

// Uniswap V2 Pair ABI (minimal)
const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function totalSupply() external view returns (uint256)'
];

// ERC20 ABI for getting token info
const ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)'
];

// Factory ABI
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

async function debugLPToken() {
  console.log('Starting debug...');
  try {
    // Connect to your RPC provider
    const provider = new ethers.JsonRpcProvider('https://rpc.bctchain.com');
    console.log('Provider connected...');
    
    console.log(`🔍 Debugging LP token: ${LP_TOKEN_ADDRESS}`);
    
    // Create pair contract instance
    const pairContract = new ethers.Contract(LP_TOKEN_ADDRESS, PAIR_ABI, provider);
    
    // Get token addresses from the LP token
    const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
      pairContract.token0(),
      pairContract.token1(),
      pairContract.getReserves(),
      pairContract.totalSupply()
    ]);

    console.log(`\nLP Token Information:`);
    console.log(`Token0: ${token0Address}`);
    console.log(`Token1: ${token1Address}`);
    console.log(`Reserves: ${reserves[0].toString()}, ${reserves[1].toString()}`);
    console.log(`Total Supply: ${totalSupply.toString()}`);

    // Get token info for both tokens
    const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, provider);
    const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, provider);

    const [token0Name, token0Symbol, token0Decimals] = await Promise.all([
      token0Contract.name(),
      token0Contract.symbol(),
      token0Contract.decimals()
    ]);

    const [token1Name, token1Symbol, token1Decimals] = await Promise.all([
      token1Contract.name(),
      token1Contract.symbol(),
      token1Contract.decimals()
    ]);

    console.log(`\nToken0 Details:`);
    console.log(`  Name: ${token0Name}`);
    console.log(`  Symbol: ${token0Symbol}`);
    console.log(`  Decimals: ${token0Decimals}`);
    console.log(`  Reserve: ${ethers.formatUnits(reserves[0], token0Decimals)}`);

    console.log(`\nToken1 Details:`);
    console.log(`  Name: ${token1Name}`);
    console.log(`  Symbol: ${token1Symbol}`);
    console.log(`  Decimals: ${token1Decimals}`);
    console.log(`  Reserve: ${ethers.formatUnits(reserves[1], token1Decimals)}`);

    // Try to check with factory (BCTChain factory address)
    const FACTORY_ADDRESS = '0x1ab5Df4e4f8520099bD5f31FaCCe010b1C8cb996'; // BCTChain Factory
    try {
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const factoryPairAddress = await factoryContract.getPair(token0Address, token1Address);
      
      console.log(`\nFactory Verification:`);
      console.log(`Factory returns pair address: ${factoryPairAddress}`);
      console.log(`LP token address: ${LP_TOKEN_ADDRESS}`);
      console.log(`Addresses match: ${factoryPairAddress.toLowerCase() === LP_TOKEN_ADDRESS.toLowerCase()}`);
    } catch (factoryError) {
      console.log(`\nFactory check failed: ${factoryError.message}`);
    }

    console.log(`\n✅ LP token appears to be valid with reserves!`);
    
  } catch (error) {
    console.error(`❌ Error debugging LP token:`, error);
    console.error('Full error:', error);
  }
}

console.log('Script loaded, calling debugLPToken...');
debugLPToken().then(() => {
  console.log('Debug completed');
}).catch(err => {
  console.error('Promise error:', err);
});
