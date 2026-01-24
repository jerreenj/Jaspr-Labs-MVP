from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging
import httpx
from supabase import create_client, Client
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase client
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Create the main app
app = FastAPI(title="JASPR Crypto Wallet API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class UserProfile(BaseModel):
    privy_did: str
    email: Optional[str] = None
    username: Optional[str] = None

class WalletCreate(BaseModel):
    address: str
    privy_did: str
    chain: str = "base"

class WalletResponse(BaseModel):
    id: str
    address: str
    chain: str
    balances: dict = {}

class SendTransaction(BaseModel):
    from_address: str
    to_address: str
    amount: str
    token_symbol: str = "ETH"

class SwapQuoteRequest(BaseModel):
    from_token: str
    to_token: str
    amount: str
    wallet_address: str

class TransactionResponse(BaseModel):
    id: str
    tx_hash: str
    from_address: str
    to_address: str
    amount: str
    token_symbol: str
    tx_type: str
    status: str
    created_at: str

# Auth middleware
async def verify_privy_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    token = authorization.replace("Bearer ", "")
    # In production, verify token with Privy
    # For MVP, we'll trust the token
    return token

# Routes
@api_router.get("/")
async def root():
    return {"message": "JASPR API", "version": "1.0.0"}

@api_router.post("/users/profile")
async def create_or_update_profile(
    profile: UserProfile,
    token: str = Depends(verify_privy_token)
):
    """Create or update user profile"""
    try:
        # Check if profile exists
        response = supabase.table('profiles').select('*').eq('privy_did', profile.privy_did).execute()
        
        if response.data:
            # Update existing profile
            result = supabase.table('profiles').update({
                'email': profile.email,
                'username': profile.username
            }).eq('privy_did', profile.privy_did).execute()
        else:
            # Create new profile
            result = supabase.table('profiles').insert({
                'privy_did': profile.privy_did,
                'email': profile.email,
                'username': profile.username
            }).execute()
        
        return {"success": True, "profile": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Error creating/updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/profile/{privy_did}")
async def get_profile(privy_did: str):
    """Get user profile"""
    try:
        response = supabase.table('profiles').select('*').eq('privy_did', privy_did).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/wallets")
async def create_wallet(
    wallet: WalletCreate,
    token: str = Depends(verify_privy_token)
):
    """Register a wallet for a user"""
    try:
        # Check if wallet already exists
        response = supabase.table('wallets').select('*').eq('address', wallet.address).execute()
        
        if response.data:
            return {"success": True, "wallet": response.data[0]}
        
        # Create new wallet
        result = supabase.table('wallets').insert({
            'privy_did': wallet.privy_did,
            'address': wallet.address,
            'chain': wallet.chain
        }).execute()
        
        return {"success": True, "wallet": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Error creating wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wallets/{privy_did}")
async def get_wallets(privy_did: str):
    """Get all wallets for a user"""
    try:
        response = supabase.table('wallets').select('*').eq('privy_did', privy_did).execute()
        return {"wallets": response.data if response.data else []}
    except Exception as e:
        logger.error(f"Error getting wallets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/balances/{address}")
async def get_balance(address: str):
    """Get token balances for an address on Base"""
    try:
        # For MVP, return mock balances
        # In production, query Base chain via RPC or API
        return {
            "address": address,
            "chain": "base",
            "balances": {
                "ETH": "0.5",
                "USDC": "1250.50"
            }
        }
    except Exception as e:
        logger.error(f"Error getting balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/swap/quote")
async def get_swap_quote(request: SwapQuoteRequest):
    """Get swap quote from 0x API"""
    try:
        # 0x API endpoint for Base chain
        base_url = "https://api.0x.org/swap/v1/quote"
        
        # Token addresses on Base
        tokens = {
            "ETH": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            "USDC": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        }
        
        params = {
            "sellToken": tokens.get(request.from_token, tokens["ETH"]),
            "buyToken": tokens.get(request.to_token, tokens["USDC"]),
            "sellAmount": request.amount,
            "takerAddress": request.wallet_address
        }
        
        # For MVP, return mock quote
        # In production, call 0x API
        return {
            "from_token": request.from_token,
            "to_token": request.to_token,
            "from_amount": request.amount,
            "to_amount": "1250.00",
            "price": "2500.00",
            "gas_estimate": "0.001",
            "quote_id": "mock-quote-123"
        }
    except Exception as e:
        logger.error(f"Error getting swap quote: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/transactions")
async def create_transaction(
    tx: SendTransaction,
    token: str = Depends(verify_privy_token)
):
    """Record a transaction"""
    try:
        result = supabase.table('transactions').insert({
            'from_address': tx.from_address,
            'to_address': tx.to_address,
            'amount': tx.amount,
            'token_symbol': tx.token_symbol,
            'tx_type': 'send',
            'status': 'pending',
            'tx_hash': f"0xmock{datetime.now().timestamp()}"
        }).execute()
        
        return {"success": True, "transaction": result.data[0] if result.data else None}
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/transactions/{address}")
async def get_transactions(address: str, limit: int = 10):
    """Get transaction history for an address"""
    try:
        response = supabase.table('transactions')\
            .select('*')\
            .or_(f'from_address.eq.{address},to_address.eq.{address}')\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return {"transactions": response.data if response.data else []}
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
