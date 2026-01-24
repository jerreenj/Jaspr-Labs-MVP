from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime
from supabase import create_client, Client
import httpx
from dotenv import load_dotenv

load_dotenv()

# Supabase setup
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

app = FastAPI(title="JASPR API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: str
    wallet_address: str
    provider: str = 'email'

class SwapRequest(BaseModel):
    wallet_address: str
    from_token: str
    to_token: str
    amount: str
    chain_id: int = 84532

class TransactionRecord(BaseModel):
    wallet_address: str
    tx_hash: str
    from_token: str
    to_token: str
    amount_in: str
    amount_out: str
    tx_type: str
    status: str = 'completed'

# Uniswap V3 contract addresses on Base Sepolia
UNISWAP_V3_ROUTER = '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4'  # Base Sepolia
UNISWAP_V3_QUOTER = '0xC5290058841028F1614F3A6F0F5816cAd0df5E27'  # Base Sepolia

# Token addresses on Base Sepolia
TOKEN_ADDRESSES = {
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  # Base Sepolia USDC
}

# Routes
@app.get("/")
def root():
    return {"message": "JASPR API", "version": "2.0.0", "chain": "Base Sepolia"}

@app.post("/api/auth/signup")
async def signup(user: UserCreate):
    try:
        # Check if user exists
        response = supabase.table('users').select('*').eq('email', user.email).execute()
        
        if response.data:
            return {
                "success": True,
                "user": response.data[0],
                "message": "User already exists"
            }
        
        # Create new user
        user_data = {
            "email": user.email,
            "wallet_address": user.wallet_address,
            "provider": user.provider,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('users').insert(user_data).execute()
        
        return {
            "success": True,
            "user": result.data[0] if result.data else user_data,
            "message": "User created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{wallet_address}")
async def get_user(wallet_address: str):
    try:
        response = supabase.table('users').select('*').eq('wallet_address', wallet_address).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/swap/quote")
async def get_swap_quote(
    from_token: str,
    to_token: str,
    amount: str,
    chain_id: int = 84532
):
    """Get swap quote from Uniswap V3 or mock for testnet"""
    try:
        # For Base Sepolia testnet, return mock quotes
        # In production, integrate with actual Uniswap V3 quoter
        
        prices = {
            'WETH': 3000.0,
            'USDC': 1.0,
            'BTC': 50000.0,
            'ETH': 3000.0,
        }
        
        from_price = prices.get(from_token, 1.0)
        to_price = prices.get(to_token, 1.0)
        
        amount_float = float(amount)
        output_amount = (amount_float * from_price) / to_price
        
        # Apply 0.3% fee
        fee = output_amount * 0.003
        final_amount = output_amount - fee
        
        return {
            "from_token": from_token,
            "to_token": to_token,
            "amount_in": amount,
            "amount_out": str(final_amount),
            "price_impact": "0.1%",
            "fee": str(fee),
            "route": [from_token, to_token],
            "gas_estimate": "0.001"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transactions")
async def record_transaction(tx: TransactionRecord):
    try:
        tx_data = {
            "wallet_address": tx.wallet_address,
            "tx_hash": tx.tx_hash,
            "from_token": tx.from_token,
            "to_token": tx.to_token,
            "amount_in": tx.amount_in,
            "amount_out": tx.amount_out,
            "tx_type": tx.tx_type,
            "status": tx.status,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table('transactions').insert(tx_data).execute()
        
        return {
            "success": True,
            "transaction": result.data[0] if result.data else tx_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions/{wallet_address}")
async def get_transactions(wallet_address: str, limit: int = 20):
    try:
        response = supabase.table('transactions')\
            .select('*')\
            .eq('wallet_address', wallet_address)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return {
            "transactions": response.data if response.data else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tokens/base-sepolia")
async def get_token_addresses():
    """Return Base Sepolia token addresses"""
    return {
        "chain_id": 84532,
        "chain_name": "Base Sepolia",
        "tokens": TOKEN_ADDRESSES,
        "uniswap_router": UNISWAP_V3_ROUTER,
        "uniswap_quoter": UNISWAP_V3_QUOTER
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "database": "supabase",
        "chain": "Base Sepolia"
    }