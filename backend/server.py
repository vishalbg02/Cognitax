"""
Cognitax - Smart Tax Management Platform (Backend API)

Author: Vishal
Description: FastAPI backend for tax management with AI-powered analysis
"""

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Header, Response, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import io
import base64
import re
import json
from passlib.context import CryptContext
import jwt
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
GEMINI_UPLOAD_URL = "https://generativelanguage.googleapis.com/upload/v1beta/files"
GEMINI_FILES_URL = "https://generativelanguage.googleapis.com/v1beta/files"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    upload_id: str
    date: str
    description: str
    amount: float
    transaction_type: str  # debit/credit
    category: str  # Bills, Rent, Sales, etc.
    mode: str  # UPI/NEFT/IMPS/Cash
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaxCalculation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    upload_id: str
    total_income: float
    total_expenses: float
    estimated_turnover: float
    gst_amount: float
    itr_amount: float
    tds_amount: float
    tax_optimization_tips: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PDFUpload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    filename: str
    file_size: int
    bank_name: Optional[str] = None
    statement_period: Optional[str] = None
    status: str = "processing"  # processing/completed/failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    role: str  # user/assistant
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= JWT HELPERS =============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

# ============= GEMINI HELPERS =============

async def upload_file_to_gemini(file_path: str, mime_type: str) -> str:
    """Upload a file to Gemini and return the file URI."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Step 1: Initiate resumable upload
            headers = {
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": str(os.path.getsize(file_path)),
                "X-Goog-Upload-Header-Content-Type": mime_type,
                "Content-Type": "application/json"
            }
            
            metadata = {
                "file": {
                    "display_name": os.path.basename(file_path)
                }
            }
            
            response = await client.post(
                f"{GEMINI_UPLOAD_URL}?key={GEMINI_API_KEY}",
                headers=headers,
                json=metadata
            )
            response.raise_for_status()
            upload_url = response.headers.get("X-Goog-Upload-URL")
            
            # Step 2: Upload file content
            with open(file_path, "rb") as f:
                file_data = f.read()
            
            upload_headers = {
                "Content-Length": str(len(file_data)),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize"
            }
            
            upload_response = await client.put(
                upload_url,
                headers=upload_headers,
                content=file_data
            )
            upload_response.raise_for_status()
            
            file_info = upload_response.json()
            file_uri = file_info.get("file", {}).get("uri")
            file_name = file_info.get("file", {}).get("name")
            
            # Step 3: Wait for file processing
            max_retries = 30
            for _ in range(max_retries):
                status_response = await client.get(
                    f"{GEMINI_FILES_URL}/{file_name.split('/')[-1]}?key={GEMINI_API_KEY}"
                )
                status_response.raise_for_status()
                file_status = status_response.json()
                
                state = file_status.get("state")
                if state == "ACTIVE":
                    logger.info(f"File uploaded successfully: {file_uri}")
                    return file_uri
                elif state == "FAILED":
                    raise ValueError("File processing failed")
                
                await asyncio.sleep(2)
            
            raise ValueError("File processing timeout")
            
    except Exception as e:
        logger.error(f"Error uploading file to Gemini: {str(e)}")
        raise

async def generate_gemini_content(prompt: str, file_uri: str = None, system_instruction: str = None) -> str:
    """Generate content using Gemini API."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Prepare request parts
            parts = []
            
            if file_uri:
                parts.append({
                    "fileData": {
                        "mimeType": "application/pdf",
                        "fileUri": file_uri
                    }
                })
            
            parts.append({"text": prompt})
            
            # Prepare request body
            request_body = {
                "contents": [
                    {
                        "parts": parts
                    }
                ]
            }
            
            # Add system instruction if provided
            if system_instruction:
                request_body["systemInstruction"] = {
                    "parts": [
                        {"text": system_instruction}
                    ]
                }
            
            # Make API request
            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_API_KEY
            }
            
            response = await client.post(
                GEMINI_API_URL,
                headers=headers,
                json=request_body
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    text_parts = [part.get("text", "") for part in candidate["content"]["parts"]]
                    return "".join(text_parts)
            
            raise ValueError("No valid response from Gemini API")
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Gemini API HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e.response.text}")
    except Exception as e:
        logger.error(f"Error generating content with Gemini: {str(e)}")
        raise

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Return user without password_hash
    user_response = user.model_dump()
    del user_response['password_hash']
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    # Verify password
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    # Return user without password_hash
    user_response = user.model_dump()
    del user_response['password_hash']
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    user_response = current_user.model_dump()
    del user_response['password_hash']
    return user_response

# ============= PDF UPLOAD & PARSING =============

@api_router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    user = current_user
    
    try:
        # Read file
        content = await file.read()
        
        # Save upload record
        upload = PDFUpload(
            user_id=user.id,
            filename=file.filename,
            file_size=len(content)
        )
        
        upload_dict = upload.model_dump()
        upload_dict['created_at'] = upload_dict['created_at'].isoformat()
        await db.pdf_uploads.insert_one(upload_dict)
        
        # Save file temporarily
        temp_path = f"/tmp/{upload.id}.pdf"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Parse with Gemini
        try:
            # Upload file to Gemini
            file_uri = await upload_file_to_gemini(temp_path, "application/pdf")
            
            prompt = """Analyze this Indian bank statement PDF and extract ALL transactions in JSON format.
            
For each transaction, provide:
- date (DD/MM/YYYY or DD-MMM-YYYY format)
- description (transaction narration)
- amount (numeric value)
- transaction_type ("credit" or "debit")
- category (classify as: Sales, Bills, Rent, Salary, Transfer, Shopping, Food, Transport, Medical, Entertainment, Investment, Other)
- mode (UPI, NEFT, IMPS, RTGS, Cash, Cheque, ATM, Card, or Unknown)

Also extract:
- bank_name
- statement_period (e.g., "Jan 2024 - Mar 2024")

Return ONLY valid JSON in this exact format:
{
  "bank_name": "string",
  "statement_period": "string",
  "transactions": [
    {
      "date": "string",
      "description": "string",
      "amount": number,
      "transaction_type": "credit" or "debit",
      "category": "string",
      "mode": "string"
    }
  ]
}"""
            
            system_instruction = "You are an expert at parsing Indian bank statements. Extract transaction data accurately."
            
            response = await generate_gemini_content(
                prompt=prompt,
                file_uri=file_uri,
                system_instruction=system_instruction
            )
            
            # Parse response
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            parsed_data = json.loads(response_text)
            
            # Save transactions
            transactions = []
            for txn in parsed_data.get("transactions", []):
                transaction = Transaction(
                    user_id=user.id,
                    upload_id=upload.id,
                    date=txn["date"],
                    description=txn["description"],
                    amount=float(txn["amount"]),
                    transaction_type=txn["transaction_type"],
                    category=txn["category"],
                    mode=txn["mode"]
                )
                txn_dict = transaction.model_dump()
                txn_dict['created_at'] = txn_dict['created_at'].isoformat()
                await db.transactions.insert_one(txn_dict)
                transactions.append(transaction)
            
            # Update upload record
            await db.pdf_uploads.update_one(
                {"id": upload.id},
                {"$set": {
                    "status": "completed",
                    "bank_name": parsed_data.get("bank_name"),
                    "statement_period": parsed_data.get("statement_period")
                }}
            )
            
            # Calculate tax
            total_income = sum(t.amount for t in transactions if t.transaction_type == "credit")
            total_expenses = sum(t.amount for t in transactions if t.transaction_type == "debit")
            estimated_turnover = total_income
            
            # Basic tax calculations (simplified)
            gst_amount = estimated_turnover * 0.18 if estimated_turnover > 2000000 else 0
            itr_amount = max(0, (estimated_turnover - total_expenses - 250000) * 0.30)
            tds_amount = estimated_turnover * 0.01 if estimated_turnover > 5000000 else 0
            
            # Get AI optimization tips
            tips_prompt = f"""Based on this financial data:
- Total Income: ₹{total_income:,.2f}
- Total Expenses: ₹{total_expenses:,.2f}
- Estimated Turnover: ₹{estimated_turnover:,.2f}

Provide exactly 5 practical tax optimization tips for Indian businesses. Return as JSON array of strings.
Example: ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]"""
            
            tips_response = await generate_gemini_content(
                prompt=tips_prompt,
                system_instruction="You are an Indian tax expert providing optimization advice."
            )
            
            tips_text = tips_response.strip()
            if "```json" in tips_text:
                tips_text = tips_text.split("```json")[1].split("```")[0].strip()
            elif "```" in tips_text:
                tips_text = tips_text.split("```")[1].split("```")[0].strip()
            
            try:
                tips = json.loads(tips_text)
            except:
                tips = [
                    "Maintain proper GST invoices for all transactions",
                    "Claim deductions under Section 80C",
                    "Consider tax-saving investments",
                    "Keep records of business expenses",
                    "File returns on time to avoid penalties"
                ]
            
            tax_calc = TaxCalculation(
                user_id=user.id,
                upload_id=upload.id,
                total_income=total_income,
                total_expenses=total_expenses,
                estimated_turnover=estimated_turnover,
                gst_amount=gst_amount,
                itr_amount=itr_amount,
                tds_amount=tds_amount,
                tax_optimization_tips=tips
            )
            
            tax_dict = tax_calc.model_dump()
            tax_dict['created_at'] = tax_dict['created_at'].isoformat()
            await db.tax_calculations.insert_one(tax_dict)
            
            # Cleanup
            os.remove(temp_path)
            
            return {
                "upload_id": upload.id,
                "status": "completed",
                "transactions_count": len(transactions),
                "bank_name": parsed_data.get("bank_name"),
                "statement_period": parsed_data.get("statement_period"),
                "tax_summary": tax_calc.model_dump(mode='json')
            }
            
        except Exception as e:
            logger.error(f"PDF parsing error: {str(e)}")
            await db.pdf_uploads.update_one(
                {"id": upload.id},
                {"$set": {"status": "failed"}}
            )
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= TRANSACTIONS =============

@api_router.get("/transactions")
async def get_transactions(upload_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    user = current_user
    
    query = {"user_id": user.id}
    if upload_id:
        query["upload_id"] = upload_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    for txn in transactions:
        if isinstance(txn.get('created_at'), str):
            txn['created_at'] = datetime.fromisoformat(txn['created_at'])
    
    return transactions

# ============= TAX CALCULATIONS =============

@api_router.get("/tax-calculations")
async def get_tax_calculations(current_user: User = Depends(get_current_user)):
    user = current_user
    
    tax_calcs = await db.tax_calculations.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for calc in tax_calcs:
        if isinstance(calc.get('created_at'), str):
            calc['created_at'] = datetime.fromisoformat(calc['created_at'])
    
    return tax_calcs

# ============= ANALYTICS =============

@api_router.get("/analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    user = current_user
    
    # Get all transactions
    transactions = await db.transactions.find({"user_id": user.id}, {"_id": 0}).to_list(10000)
    
    # Calculate KPIs
    total_income = sum(t["amount"] for t in transactions if t["transaction_type"] == "credit")
    total_expenses = sum(t["amount"] for t in transactions if t["transaction_type"] == "debit")
    net_cash_flow = total_income - total_expenses
    
    # Category breakdown
    category_data = {}
    for t in transactions:
        cat = t["category"]
        if cat not in category_data:
            category_data[cat] = 0
        category_data[cat] += t["amount"]
    
    # Mode breakdown
    mode_data = {}
    for t in transactions:
        mode = t["mode"]
        if mode not in mode_data:
            mode_data[mode] = 0
        mode_data[mode] += t["amount"]
    
    # Get latest tax calculation
    latest_tax = await db.tax_calculations.find_one(
        {"user_id": user.id},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_cash_flow": net_cash_flow,
        "transactions_count": len(transactions),
        "category_breakdown": category_data,
        "mode_breakdown": mode_data,
        "latest_tax": latest_tax
    }

# ============= CHATBOT =============

@api_router.post("/chat")
async def chat(request: Request, current_user: User = Depends(get_current_user)):
    user = current_user
    
    try:
        data = await request.json()
        message = data.get("message")
        session_id = data.get("session_id", str(uuid.uuid4()))
        
        if not message:
            raise HTTPException(status_code=400, detail="Message required")
        
        # Save user message
        user_msg = ChatMessage(
            user_id=user.id,
            session_id=session_id,
            role="user",
            message=message
        )
        user_msg_dict = user_msg.model_dump()
        user_msg_dict['created_at'] = user_msg_dict['created_at'].isoformat()
        await db.chat_messages.insert_one(user_msg_dict)
        
        # Get context from user's data
        transactions = await db.transactions.find({"user_id": user.id}, {"_id": 0}).limit(50).to_list(50)
        latest_tax = await db.tax_calculations.find_one(
            {"user_id": user.id},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        context = f"""User's Financial Context:
- Total Transactions: {len(transactions)}
- Latest Tax Calculation: {json.dumps(latest_tax, default=str) if latest_tax else 'None'}
"""
        
        system_instruction = f"""You are an expert Indian tax assistant helping with GST, ITR, TDS, and business tax queries.
Provide accurate, helpful advice based on Indian tax laws (2025).

{context}"""
        
        # Chat with Gemini
        response = await generate_gemini_content(
            prompt=message,
            system_instruction=system_instruction
        )
        
        # Save assistant message
        assistant_msg = ChatMessage(
            user_id=user.id,
            session_id=session_id,
            role="assistant",
            message=response
        )
        assistant_msg_dict = assistant_msg.model_dump()
        assistant_msg_dict['created_at'] = assistant_msg_dict['created_at'].isoformat()
        await db.chat_messages.insert_one(assistant_msg_dict)
        
        return {
            "session_id": session_id,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history")
async def get_chat_history(session_id: str, current_user: User = Depends(get_current_user)):
    user = current_user
    
    messages = await db.chat_messages.find(
        {"user_id": user.id, "session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages

# ============= UPLOADS LIST =============

@api_router.get("/uploads")
async def get_uploads(current_user: User = Depends(get_current_user)):
    user = current_user
    
    uploads = await db.pdf_uploads.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for upload in uploads:
        if isinstance(upload.get('created_at'), str):
            upload['created_at'] = datetime.fromisoformat(upload['created_at'])
    
    return uploads

# ============= MAIN APP =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()