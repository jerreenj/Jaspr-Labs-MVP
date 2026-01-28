// Base Sepolia Configuration (uses env vars in production)
import Constants from 'expo-constants';

export const BASE_SEPOLIA_CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_BASE_SEPOLIA_CHAIN_ID || Constants.expoConfig?.extra?.baseSeploliaChainId || '84532');
export const BASE_SEPOLIA_RPC = process.env.EXPO_PUBLIC_BASE_SEPOLIA_RPC || Constants.expoConfig?.extra?.baseSepoliaRpc || 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER = process.env.EXPO_PUBLIC_BASE_EXPLORER || Constants.expoConfig?.extra?.baseExplorer || 'https://sepolia.basescan.org';

// Uniswap V3 on Base Sepolia
export const UNISWAP_V3_ROUTER = '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4';
export const UNISWAP_V3_QUOTER = '0xC5290058841028F1614F3A6F0F5816cAd0df5E27';

// Token addresses on Base Sepolia
export const TOKEN_ADDRESSES = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// Supported tokens for trading
export const TOKENS = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    tradeable: false, // Mock only
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    address: TOKEN_ADDRESSES.WETH,
    tradeable: true,
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    address: TOKEN_ADDRESSES.USDC,
    tradeable: true,
    decimals: 6,
  },
];

// Uniswap V3 Router ABI (minimal)
export const UNISWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
];

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];