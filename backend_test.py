#!/usr/bin/env python3
"""
JASPR Crypto Wallet Backend API Test Suite
Tests all backend endpoints for functionality and error handling
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://trade-portfolio-16.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test data
TEST_WALLET = "0xtest123456789abcdef"
INVALID_WALLET = "0xinvalid999"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(test_name, status, details=""):
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.END} {test_name}")
    if details:
        print(f"    {details}")

def test_health_endpoint():
    """Test GET /api/health endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Health Endpoint ==={Colors.END}")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy" and data.get("connected") == True:
                log_test("Health Check", "PASS", f"MongoDB connected: {data.get('connected')}")
                return True
            else:
                log_test("Health Check", "FAIL", f"Unhealthy response: {data}")
                return False
        else:
            log_test("Health Check", "FAIL", f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Health Check", "FAIL", f"Exception: {str(e)}")
        return False

def test_root_endpoint():
    """Test GET / endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Root Endpoint ==={Colors.END}")
    
    try:
        response = requests.get(BACKEND_URL, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "JASPR API" in data.get("message", ""):
                log_test("Root Endpoint", "PASS", f"Version: {data.get('version')}")
                return True
            else:
                log_test("Root Endpoint", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("Root Endpoint", "FAIL", f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Root Endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_create_account():
    """Test POST /api/account/create endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Account Creation ==={Colors.END}")
    
    # Test data as specified in review request
    account_data = {
        "wallet_address": TEST_WALLET,
        "provider": "quickstart"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/account/create",
            json=account_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True and "account" in data:
                account = data["account"]
                if account.get("wallet_address") == TEST_WALLET:
                    log_test("Create Account", "PASS", 
                           f"Account created - Balance: ${account.get('balance')}, New: {data.get('is_new')}")
                    return True, account
                else:
                    log_test("Create Account", "FAIL", "Wallet address mismatch")
                    return False, None
            else:
                log_test("Create Account", "FAIL", f"Invalid response structure: {data}")
                return False, None
        else:
            log_test("Create Account", "FAIL", f"Status code: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("Create Account", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_get_account(wallet_address):
    """Test GET /api/account/{wallet_address} endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Get Account ==={Colors.END}")
    
    try:
        response = requests.get(f"{API_BASE}/account/{wallet_address}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True and "account" in data:
                account = data["account"]
                log_test("Get Account", "PASS", 
                       f"Retrieved account - Address: {account.get('wallet_address')}")
                return True, account
            else:
                log_test("Get Account", "FAIL", f"Invalid response structure: {data}")
                return False, None
        else:
            log_test("Get Account", "FAIL", f"Status code: {response.status_code}")
            return False, None
            
    except Exception as e:
        log_test("Get Account", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_get_invalid_account():
    """Test GET /api/account/{wallet_address} with invalid address"""
    print(f"\n{Colors.BLUE}=== Testing Get Invalid Account ==={Colors.END}")
    
    try:
        response = requests.get(f"{API_BASE}/account/{INVALID_WALLET}", timeout=10)
        
        if response.status_code == 404:
            log_test("Get Invalid Account", "PASS", "Correctly returned 404 for invalid wallet")
            return True
        else:
            log_test("Get Invalid Account", "FAIL", 
                   f"Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Get Invalid Account", "FAIL", f"Exception: {str(e)}")
        return False

def test_sync_account():
    """Test PUT /api/account/sync endpoint"""
    print(f"\n{Colors.BLUE}=== Testing Account Sync ==={Colors.END}")
    
    # Test data as specified in review request
    sync_data = {
        "wallet_address": TEST_WALLET,
        "balance": 9500,
        "holdings": {"BTC": 0.001},
        "purchase_info": {},
        "swap_count": 1,
        "tx_history": []
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/account/sync",
            json=sync_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True and "account" in data:
                account = data["account"]
                if (account.get("balance") == 9500 and 
                    account.get("swap_count") == 1 and
                    "BTC" in account.get("holdings", {})):
                    log_test("Sync Account", "PASS", 
                           f"Account synced - Balance: ${account.get('balance')}, Holdings: {account.get('holdings')}")
                    return True, account
                else:
                    log_test("Sync Account", "FAIL", "Data not properly updated")
                    return False, None
            else:
                log_test("Sync Account", "FAIL", f"Invalid response structure: {data}")
                return False, None
        else:
            log_test("Sync Account", "FAIL", f"Status code: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("Sync Account", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_sync_invalid_account():
    """Test PUT /api/account/sync with invalid wallet address"""
    print(f"\n{Colors.BLUE}=== Testing Sync Invalid Account ==={Colors.END}")
    
    sync_data = {
        "wallet_address": INVALID_WALLET,
        "balance": 5000
    }
    
    try:
        response = requests.put(
            f"{API_BASE}/account/sync",
            json=sync_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 404:
            log_test("Sync Invalid Account", "PASS", "Correctly returned 404 for invalid wallet")
            return True
        else:
            log_test("Sync Invalid Account", "FAIL", 
                   f"Expected 404, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Sync Invalid Account", "FAIL", f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print(f"{Colors.BLUE}{'='*60}")
    print("JASPR CRYPTO WALLET BACKEND API TEST SUITE")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print(f"{'='*60}{Colors.END}")
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "details": []
    }
    
    # Test 1: Health endpoint
    results["total"] += 1
    if test_health_endpoint():
        results["passed"] += 1
        results["details"].append("✅ Health endpoint working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Health endpoint failed")
    
    # Test 2: Root endpoint
    results["total"] += 1
    if test_root_endpoint():
        results["passed"] += 1
        results["details"].append("✅ Root endpoint working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Root endpoint failed")
    
    # Test 3: Create account
    results["total"] += 1
    success, account = test_create_account()
    if success:
        results["passed"] += 1
        results["details"].append("✅ Account creation working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Account creation failed")
        return results  # Can't continue without account
    
    # Test 4: Get account
    results["total"] += 1
    if test_get_account(TEST_WALLET)[0]:
        results["passed"] += 1
        results["details"].append("✅ Get account working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Get account failed")
    
    # Test 5: Get invalid account (should return 404)
    results["total"] += 1
    if test_get_invalid_account():
        results["passed"] += 1
        results["details"].append("✅ Invalid account handling working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Invalid account handling failed")
    
    # Test 6: Sync account
    results["total"] += 1
    if test_sync_account()[0]:
        results["passed"] += 1
        results["details"].append("✅ Account sync working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Account sync failed")
    
    # Test 7: Sync invalid account (should return 404)
    results["total"] += 1
    if test_sync_invalid_account():
        results["passed"] += 1
        results["details"].append("✅ Invalid sync handling working")
    else:
        results["failed"] += 1
        results["details"].append("❌ Invalid sync handling failed")
    
    # Print summary
    print(f"\n{Colors.BLUE}{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}{Colors.END}")
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.END}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.END}")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    
    print(f"\n{Colors.BLUE}DETAILED RESULTS:{Colors.END}")
    for detail in results["details"]:
        print(f"  {detail}")
    
    return results

if __name__ == "__main__":
    results = run_all_tests()
    
    # Exit with error code if any tests failed
    if results["failed"] > 0:
        exit(1)
    else:
        print(f"\n{Colors.GREEN}All tests passed! 🎉{Colors.END}")
        exit(0)