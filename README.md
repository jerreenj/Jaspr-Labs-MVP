# JASPR - Crypto Wallet + DEX Aggregator

A non-custodial cryptocurrency wallet with swap functionality built on Base chain.

## Features

- ✅ **Non-Custodial Wallet**: Privy embedded wallet (you control your keys)
- ✅ **Multi-Token Support**: ETH and USDC on Base
- ✅ **DEX Aggregator**: Swap tokens using 0x API
- ✅ **Transaction History**: Track all your sends and swaps
- ✅ **Modern UI**: Clean, mobile-first fintech design
- ✅ **Safety Features**: Pre-transaction safety checks

## Tech Stack

- **Frontend**: Expo React Native (iOS, Android, Web)
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Privy (Email + Google OAuth)
- **Blockchain**: Base (EVM chain)
- **DEX**: 0x API for swaps

## Setup Instructions

### 1. Supabase Setup

1. Go to https://bkkltqqvfhvatgkbuhoe.supabase.co
2. Navigate to SQL Editor
3. Run the contents of `supabase_setup.sql` to create tables

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python server.py
```

Backend will run on http://localhost:8001

### 3. Frontend Setup

```bash
cd frontend
yarn install
yarn start
```

Expo will start on http://localhost:3000

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://bkkltqqvfhvatgkbuhoe.supabase.co
SUPABASE_ANON_KEY=sb_publishable_h0HsIIP4jcTmRJ-IS2Iihw_GC7cEXk8
SUPABASE_SERVICE_KEY=sb_secret_uTYc1JeCO61LZr9LHJwnhw_BsZ2BcPC
PRIVY_APP_ID=cmkrvglr70122jl0cbrw349iu
BASE_RPC_URL=https://mainnet.base.org
BASE_CHAIN_ID=8453
```

### Frontend (.env)
```
EXPO_PUBLIC_PRIVY_APP_ID=cmkrvglr70122jl0cbrw349iu
EXPO_PUBLIC_SUPABASE_URL=https://bkkltqqvfhvatgkbuhoe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_h0HsIIP4jcTmRJ-IS2Iihw_GC7cEXk8
EXPO_PUBLIC_BACKEND_URL=https://jaspr-swap.preview.emergentagent.com
```

## App Screens

1. **Landing Page** - Hero section with "Launch App" CTA
2. **Auth** - Email/Google login via Privy
3. **Dashboard** - Wallet address, token balances, action buttons
4. **Send** - Send ETH/USDC to any address
5. **Swap** - Swap ETH ↔ USDC with live quotes
6. **History** - Last 10 transactions

## MVP Status

### ✅ Completed
- Landing page with branding
- Privy authentication (Email + Google)
- Embedded wallet integration
- Dashboard with balances
- Send functionality with validation
- Swap with quote system (0x API ready)
- Transaction history
- Safety check banners
- Error handling
- Loading states

### 📝 For Production
- Actual blockchain transactions (currently mocked)
- Real balance fetching from Base RPC
- 0x API integration for live swaps
- Transaction signing with Privy wallet
- Gas estimation
- More tokens (WETH, DAI, etc.)
- Price charts
- Notifications

## Safety Features

- ⚠️ Address validation before sending
- ⚠️ Confirmation modal with safety warnings
- ⚠️ "JASPR never asks for seed phrases" reminders
- ⚠️ Non-custodial wallet (you control keys)

## Notes

- **Base Chain**: Using Base for low gas fees
- **0x API**: No KYC required for swaps
- **Privy**: Handles wallet creation and auth
- **Supabase**: Free tier for database

## Development

```bash
# Start backend
cd backend && python server.py

# Start frontend
cd frontend && yarn start

# View on mobile
# Scan QR code with Expo Go app
```

## License

MIT
