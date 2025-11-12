#!/usr/bin/env python3
"""
Cognitax Backend API Testing Suite
Tests all backend endpoints for functionality and proper responses
"""

import requests
import json
import uuid
import time
from datetime import datetime
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/frontend/.env')

# Configuration
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pdf-export-debug.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class CognitaxAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_auth_register(self):
        """Test user registration endpoint"""
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@cognitax.com"
        test_data = {
            "email": test_email,
            "name": "Cognitax Test User",
            "password": "SecurePassword123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.auth_token = data['access_token']
                    self.user_data = data['user']
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_test("User Registration", True, f"Successfully registered user: {test_email}")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing access_token or user in response", data)
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            
        return False
    
    def test_auth_login(self):
        """Test user login endpoint"""
        if not self.user_data:
            self.log_test("User Login", False, "No user data available for login test")
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "SecurePassword123!"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.log_test("User Login", True, f"Successfully logged in user: {self.user_data['email']}")
                    return True
                else:
                    self.log_test("User Login", False, "Missing access_token or user in response", data)
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            
        return False
    
    def test_auth_me(self):
        """Test getting current user info"""
        if not self.auth_token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'email' in data and 'name' in data:
                    self.log_test("Get Current User", True, f"Successfully retrieved user info for: {data['email']}")
                    return True
                else:
                    self.log_test("Get Current User", False, "Missing required user fields in response", data)
            else:
                self.log_test("Get Current User", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            
        return False
    
    def test_upload_pdf(self):
        """Test PDF upload endpoint (without actual file)"""
        if not self.auth_token:
            self.log_test("PDF Upload", False, "No auth token available")
            return False
            
        try:
            # Test with empty request to check endpoint availability
            response = self.session.post(f"{API_BASE}/upload-pdf")
            
            # We expect 422 (validation error) since we're not sending a file
            if response.status_code == 422:
                self.log_test("PDF Upload Endpoint", True, "Endpoint is accessible and validates input correctly")
                return True
            elif response.status_code == 401:
                self.log_test("PDF Upload", False, "Authentication failed - token may be invalid")
            else:
                self.log_test("PDF Upload", False, f"Unexpected response: HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("PDF Upload", False, f"Exception: {str(e)}")
            
        return False
    
    def test_transactions(self):
        """Test transactions endpoint"""
        if not self.auth_token:
            self.log_test("Get Transactions", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/transactions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Transactions", True, f"Successfully retrieved {len(data)} transactions")
                    return True
                else:
                    self.log_test("Get Transactions", False, "Response is not a list", data)
            else:
                self.log_test("Get Transactions", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Transactions", False, f"Exception: {str(e)}")
            
        return False
    
    def test_uploads(self):
        """Test uploads history endpoint"""
        if not self.auth_token:
            self.log_test("Get Uploads", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/uploads")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Uploads", True, f"Successfully retrieved {len(data)} upload records")
                    return True
                else:
                    self.log_test("Get Uploads", False, "Response is not a list", data)
            else:
                self.log_test("Get Uploads", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Uploads", False, f"Exception: {str(e)}")
            
        return False
    
    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.auth_token:
            self.log_test("Get Analytics", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/analytics")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ['total_income', 'total_expenses', 'net_cash_flow', 'transactions_count', 'category_breakdown', 'mode_breakdown']
                if all(field in data for field in expected_fields):
                    self.log_test("Get Analytics", True, f"Successfully retrieved analytics data with all required fields")
                    return True
                else:
                    missing_fields = [field for field in expected_fields if field not in data]
                    self.log_test("Get Analytics", False, f"Missing required fields: {missing_fields}", data)
            else:
                self.log_test("Get Analytics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Analytics", False, f"Exception: {str(e)}")
            
        return False
    
    def test_tax_calculations(self):
        """Test tax calculations endpoint"""
        if not self.auth_token:
            self.log_test("Get Tax Calculations", False, "No auth token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/tax-calculations")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Tax Calculations", True, f"Successfully retrieved {len(data)} tax calculation records")
                    return True
                else:
                    self.log_test("Get Tax Calculations", False, "Response is not a list", data)
            else:
                self.log_test("Get Tax Calculations", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Tax Calculations", False, f"Exception: {str(e)}")
            
        return False
    
    def test_chat(self):
        """Test AI chatbot endpoint"""
        if not self.auth_token:
            self.log_test("Chat Endpoint", False, "No auth token available")
            return False
            
        chat_data = {
            "message": "What are the current GST rates in India?",
            "session_id": str(uuid.uuid4())
        }
        
        try:
            response = self.session.post(f"{API_BASE}/chat", json=chat_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'response' in data and 'session_id' in data:
                    self.log_test("Chat Endpoint", True, f"Successfully received AI response: {data['response'][:100]}...")
                    return True
                else:
                    self.log_test("Chat Endpoint", False, "Missing response or session_id in response", data)
            else:
                self.log_test("Chat Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Chat Endpoint", False, f"Exception: {str(e)}")
            
        return False
    
    def test_chat_history(self):
        """Test chat history endpoint"""
        if not self.auth_token:
            self.log_test("Chat History", False, "No auth token available")
            return False
            
        # Use a test session ID
        session_id = str(uuid.uuid4())
        
        try:
            response = self.session.get(f"{API_BASE}/chat/history?session_id={session_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Chat History", True, f"Successfully retrieved {len(data)} chat messages")
                    return True
                else:
                    self.log_test("Chat History", False, "Response is not a list", data)
            else:
                self.log_test("Chat History", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Chat History", False, f"Exception: {str(e)}")
            
        return False
    
    def run_all_tests(self):
        """Run all API tests in sequence"""
        print(f"\n🚀 Starting Cognitax Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Authentication flow
        if self.test_auth_register():
            self.test_auth_login()
            self.test_auth_me()
            
            # Core functionality tests
            self.test_upload_pdf()
            self.test_transactions()
            self.test_uploads()
            self.test_analytics()
            self.test_tax_calculations()
            
            # Chat functionality tests
            self.test_chat()
            self.test_chat_history()
        else:
            print("❌ Registration failed - skipping authenticated endpoint tests")
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['message']}")
        
        return passed, total

if __name__ == "__main__":
    tester = CognitaxAPITester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if passed == total else 1)