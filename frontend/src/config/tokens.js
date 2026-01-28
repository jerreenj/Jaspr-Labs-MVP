// Token configurations for JASPR
export const TOKENS = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    testnetSymbol: 'jBTC',
    decimals: 18,
    coingeckoId: 'bitcoin',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    testnetSymbol: 'jETH',
    decimals: 18,
    coingeckoId: 'ethereum',
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    testnetSymbol: 'jSOL',
    decimals: 18,
    coingeckoId: 'solana',
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    testnetSymbol: 'jBNB',
    decimals: 18,
    coingeckoId: 'binancecoin',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    testnetSymbol: 'jXRP',
    decimals: 18,
    coingeckoId: 'ripple',
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    testnetSymbol: 'jADA',
    decimals: 18,
    coingeckoId: 'cardano',
  },
  {
    id: 'dogecoin',
    symbol: 'DOGE',
    name: 'Dogecoin',
    testnetSymbol: 'jDOGE',
    decimals: 18,
    coingeckoId: 'dogecoin',
  },
  {
    id: 'avalanche-2',
    symbol: 'AVAX',
    name: 'Avalanche',
    testnetSymbol: 'jAVAX',
    decimals: 18,
    coingeckoId: 'avalanche-2',
  },
  {
    id: 'the-open-network',
    symbol: 'TON',
    name: 'Toncoin',
    testnetSymbol: 'jTON',
    decimals: 18,
    coingeckoId: 'the-open-network',
  },
  {
    id: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    testnetSymbol: 'jMATIC',
    decimals: 18,
    coingeckoId: 'matic-network',
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    testnetSymbol: 'USDC',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
];

export const BASE_SEPOLIA_CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_BASE_SEPOLIA_CHAIN_ID || '84532');
export const BASE_SEPOLIA_RPC = process.env.EXPO_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER = process.env.EXPO_PUBLIC_BASE_EXPLORER || 'https://sepolia.basescan.org';

// Contract addresses (UPDATE AFTER DEPLOYMENT)
export const CONTRACTS = {
  MockUSDC: '0x0000000000000000000000000000000000000000', // Update after deploy
  SimpleAMM: '0x0000000000000000000000000000000000000000', // Update after deploy
  tokens: {
    jBTC: '0x0000000000000000000000000000000000000000',
    jETH: '0x0000000000000000000000000000000000000000',
    jSOL: '0x0000000000000000000000000000000000000000',
    jBNB: '0x0000000000000000000000000000000000000000',
    jXRP: '0x0000000000000000000000000000000000000000',
    jADA: '0x0000000000000000000000000000000000000000',
    jDOGE: '0x0000000000000000000000000000000000000000',
    jAVAX: '0x0000000000000000000000000000000000000000',
    jTON: '0x0000000000000000000000000000000000000000',
    jMATIC: '0x0000000000000000000000000000000000000000',
  },
};