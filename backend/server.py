from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import secrets

# MongoDB connection
client = MongoClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client['jaspr_db']

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

class Transaction(BaseModel):
    wallet_address: str
    type: str  # 'swap', 'send', 'receive'
    from_token: str
    to_token: str
    amount: str
    status: str = 'completed'

# Routes
@app.get("/")
def root():
    return {"message": "JASPR API Running", "version": "1.0.0"}

@app.post("/api/auth/signup")
def signup(user: UserCreate):
    # Check if user exists
    existing = db.users.find_one({"email": user.email})
    if existing:
        return {"success": True, "user": {
            "email": user.email,
            "wallet_address": existing['wallet_address'],
            "id": str(existing['_id'])
        }}
    
    # Create new user
    user_doc = {
        "email": user.email,
        "wallet_address": user.wallet_address,
        "created_at": datetime.utcnow(),
        "usdc_balance": 100.0,  # Start with 100 USDC
        "token_balances": {}
    }
    result = db.users.insert_one(user_doc)
    
    return {
        "success": True,
        "user": {
            "email": user.email,
            "wallet_address": user.wallet_address,
            "id": str(result.inserted_id)
        }
    }

@app.get("/api/users/{wallet_address}/balance")
def get_balance(wallet_address: str):
    user = db.users.find_one({"wallet_address": wallet_address})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "wallet_address": wallet_address,
        "usdc_balance": user.get('usdc_balance', 0),
        "token_balances": user.get('token_balances', {})
    }

@app.post("/api/swap")
def swap(tx: Transaction):
    user = db.users.find_one({"wallet_address": tx.wallet_address})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    amount = float(tx.amount)
    
    # Simple mock swap logic
    if tx.from_token == 'USDC':
        # Buying token with USDC
        if user.get('usdc_balance', 0) < amount:
            raise HTTPException(status_code=400, detail="Insufficient USDC balance")
        
        # Deduct USDC
        db.users.update_one(
            {"wallet_address": tx.wallet_address},
            {"$inc": {"usdc_balance": -amount}}
        )
        
        # Add token (mock exchange rate: 1 USDC = 0.00002 BTC, etc.)
        token_amount = amount * 0.00002 if tx.to_token == 'BTC' else amount * 0.0003
        db.users.update_one(
            {"wallet_address": tx.wallet_address},
            {"$inc": {f"token_balances.{tx.to_token}": token_amount}}
        )
    else:
        # Selling token for USDC
        current_balance = user.get('token_balances', {}).get(tx.from_token, 0)
        if current_balance < amount:
            raise HTTPException(status_code=400, detail=f"Insufficient {tx.from_token} balance")
        
        # Deduct token
        db.users.update_one(
            {"wallet_address": tx.wallet_address},
            {"$inc": {f"token_balances.{tx.from_token}": -amount}}
        )
        
        # Add USDC
        usdc_amount = amount * 50000 if tx.from_token == 'BTC' else amount * 3000
        db.users.update_one(
            {"wallet_address": tx.wallet_address},
            {"$inc": {"usdc_balance": usdc_amount}}
        )
    
    # Record transaction
    tx_doc = {
        "wallet_address": tx.wallet_address,
        "type": tx.type,
        "from_token": tx.from_token,
        "to_token": tx.to_token,
        "amount": tx.amount,
        "status": "completed",
        "tx_hash": f"0x{secrets.token_hex(32)}",
        "created_at": datetime.utcnow()
    }
    db.transactions.insert_one(tx_doc)
    
    return {
        "success": True,
        "tx_hash": tx_doc['tx_hash'],
        "message": f"Swapped {tx.amount} {tx.from_token} for {tx.to_token}"
    }

@app.get("/api/transactions/{wallet_address}")
def get_transactions(wallet_address: str, limit: int = 10):
    txs = list(db.transactions.find(
        {"wallet_address": wallet_address}
    ).sort("created_at", -1).limit(limit))
    
    for tx in txs:
        tx['_id'] = str(tx['_id'])
        tx['created_at'] = tx['created_at'].isoformat()
    
    return {"transactions": txs}

@app.get("/health")
def health():
    return {"status": "healthy", "database": "connected"}