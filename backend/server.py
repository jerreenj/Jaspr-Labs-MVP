from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup - use DB_NAME from env for production compatibility
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'jaspr_db')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db['users']
transactions_collection = db['transactions']
waitlist_collection = db['waitlist']  # For collecting emails

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
class AccountCreate(BaseModel):
    wallet_address: str
    username: Optional[str] = None
    provider: str = 'quickstart'

class AccountUpdate(BaseModel):
    wallet_address: str
    balance: float
    holdings: Dict[str, float]
    purchase_info: Dict[str, Any]
    swap_count: int

class AccountSync(BaseModel):
    wallet_address: str
    balance: Optional[float] = None
    holdings: Optional[Dict[str, float]] = None
    purchase_info: Optional[Dict[str, Any]] = None
    swap_count: Optional[int] = None
    tx_history: Optional[List[Dict[str, Any]]] = None

class TransactionRecord(BaseModel):
    wallet_address: str
    tx_hash: str
    type: str  # buy, sell, swap
    symbol: str
    amount: float
    price: float
    usd_value: float
    timestamp: int

# Helper to convert ObjectId
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# ==================== ACCOUNT ROUTES ====================

@app.get("/api/health")
async def health():
    try:
        client.admin.command('ping')
        return {"status": "healthy", "database": "mongodb", "connected": True}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/api/account/create")
async def create_account(account: AccountCreate):
    """Create a new account or return existing one"""
    try:
        # Check if account exists
        existing = users_collection.find_one({"wallet_address": account.wallet_address})
        
        if existing:
            return {
                "success": True,
                "is_new": False,
                "account": serialize_doc(existing),
                "message": "Welcome back!"
            }
        
        # Create new account with initial state
        new_account = {
            "wallet_address": account.wallet_address,
            "username": account.username or f"User_{account.wallet_address[:8]}",
            "provider": account.provider,
            "balance": 10000.0,  # Starting demo balance
            "holdings": {},
            "purchase_info": {},
            "swap_count": 0,
            "tx_history": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = users_collection.insert_one(new_account)
        new_account['_id'] = str(result.inserted_id)
        
        return {
            "success": True,
            "is_new": True,
            "account": new_account,
            "message": "Account created with $10,000 demo balance!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/account/{wallet_address}")
async def get_account(wallet_address: str):
    """Get account by wallet address"""
    try:
        account = users_collection.find_one({"wallet_address": wallet_address})
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return {
            "success": True,
            "account": serialize_doc(account)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/account/sync")
async def sync_account(data: AccountSync):
    """Sync account data (balance, holdings, trades)"""
    try:
        account = users_collection.find_one({"wallet_address": data.wallet_address})
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # Build update object with only provided fields
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if data.balance is not None:
            update_data["balance"] = data.balance
        if data.holdings is not None:
            update_data["holdings"] = data.holdings
        if data.purchase_info is not None:
            update_data["purchase_info"] = data.purchase_info
        if data.swap_count is not None:
            update_data["swap_count"] = data.swap_count
        if data.tx_history is not None:
            update_data["tx_history"] = data.tx_history[:50]  # Keep last 50
        
        users_collection.update_one(
            {"wallet_address": data.wallet_address},
            {"$set": update_data}
        )
        
        updated = users_collection.find_one({"wallet_address": data.wallet_address})
        
        return {
            "success": True,
            "account": serialize_doc(updated),
            "message": "Account synced"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/accounts/recent")
async def get_recent_accounts(limit: int = 10):
    """Get recent accounts (for device recognition)"""
    try:
        accounts = list(users_collection.find().sort("updated_at", -1).limit(limit))
        return {
            "success": True,
            "accounts": [serialize_doc(a) for a in accounts]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TRANSACTION ROUTES ====================

@app.post("/api/transaction")
async def record_transaction(tx: TransactionRecord):
    """Record a transaction and update account"""
    try:
        tx_data = {
            "wallet_address": tx.wallet_address,
            "tx_hash": tx.tx_hash,
            "type": tx.type,
            "symbol": tx.symbol,
            "amount": tx.amount,
            "price": tx.price,
            "usd_value": tx.usd_value,
            "timestamp": tx.timestamp,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add to transactions collection
        transactions_collection.insert_one(tx_data)
        
        # Also add to user's tx_history
        users_collection.update_one(
            {"wallet_address": tx.wallet_address},
            {
                "$push": {
                    "tx_history": {
                        "$each": [tx_data],
                        "$position": 0,
                        "$slice": 50
                    }
                },
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
        )
        
        return {"success": True, "message": "Transaction recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions/{wallet_address}")
async def get_transactions(wallet_address: str, limit: int = 50):
    """Get transaction history for an account"""
    try:
        transactions = list(
            transactions_collection.find({"wallet_address": wallet_address})
            .sort("timestamp", -1)
            .limit(limit)
        )
        
        return {
            "success": True,
            "transactions": [serialize_doc(t) for t in transactions]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== UTILITY ROUTES ====================

@app.get("/")
def root():
    return {
        "message": "JASPR API",
        "version": "2.0.0",
        "database": "MongoDB",
        "endpoints": {
            "create_account": "POST /api/account/create",
            "get_account": "GET /api/account/{wallet_address}",
            "sync_account": "PUT /api/account/sync",
            "health": "GET /api/health"
        }
    }

@app.get("/health")
async def health_check():
    return await health()
