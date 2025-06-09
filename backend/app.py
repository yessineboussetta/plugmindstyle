from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from supabase import create_client, Client
from dotenv import load_dotenv
from postgrest import APIError
from passlib.context import CryptContext
import datetime, jwt, logging, os, asyncio
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from document_loader import load_and_split_pdf
from vectorstore_setup import get_qdrant_client, get_vectorstore
from uuid import uuid4
from fastapi.responses import HTMLResponse
from agents import create_agent
from langchain_community.vectorstores import Qdrant
from langchain_core.documents import Document
from langchain.chains import RetrievalQA
from embed_router import router as embed_router
from searchbot_graph import handle_search_query, ChatRequest
from sqlalchemy import create_engine, inspect
from fastapi.responses import JSONResponse
from typing import List, Optional
from document_loader import scrape_website
from utils.email import send_verification_email, send_password_reset_email
from fastapi.responses import FileResponse
from llm_utils import get_llm
from fastapi.staticfiles import StaticFiles
import shutil
import json
from fastapi import Request, HTTPException





# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
ACCESS_TOKEN_SECRET = os.getenv('ACCESS_TOKEN_SECRET', 'your_secret_key')
REFRESH_TOKEN_SECRET = os.getenv('REFRESH_TOKEN_SECRET', 'your_refresh_secret_key')
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY in .env or env")

# Initialize
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
app = FastAPI(debug=True)
logging.basicConfig(level=logging.DEBUG)
app.include_router(embed_router)
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)  # go up to PLUGMIND/
frontend_dist_dir = os.path.join(parent_dir, "frontend", "dist")
STATIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')  # no static/
PLUGIN_ZIP_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'plugmind-chatbot')
app.mount("/plugins", StaticFiles(directory=PLUGIN_ZIP_DIR), name="plugins")
app.mount("/chatbot/static", StaticFiles(directory=STATIC_DIR), name="chatbot-static")# Auth utilities
async def verify_token(authorization: str = Header(...), required_role: str = 'user') -> str:
    try:
        scheme, token = authorization.split()
        payload = jwt.decode(token, ACCESS_TOKEN_SECRET, algorithms=["HS256"])
        if payload.get('role') != required_role:
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload['user_id']
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization token")

# Dependencies for role-based access
async def get_current_user(authorization: str = Header(...)):
    return await verify_token(authorization, 'user')

async def get_current_admin(authorization: str = Header(...)):
    return await verify_token(authorization, 'admin')

# Models
class SignupRequest(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    password: str
    date: str  # YYYY-MM-DD
    role: str

    @validator('firstname', 'lastname', 'password', 'role')
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()



class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    @validator('password')
    def pw_not_empty(cls, v):
        if not v.strip(): raise ValueError('Password cannot be empty')
        return v



class RefreshTokenRequest(BaseModel):
    refresh_token: str
    role: str = 'user'

class UserUpdate(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    is_verified: Optional[bool] = None

class UserSettingsUpdateRequest(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr

class SearchBotCreate(BaseModel):
    name: str
    description: str
    db_host: str
    db_name: str
    db_user: str
    db_pass: str

class DBRequest(BaseModel):
    db_host: str
    db_name: str
    db_user: str
    db_pass: str

class ChatRequest(BaseModel):
    message: str
    
class Agent(BaseModel):
    name: str
    description: str
    website_url: Optional[str] = None
    db_host: Optional[str] = None
    db_name: Optional[str] = None
    db_user: Optional[str] = None
    db_pass: Optional[str] = None
    allowed_tables: Optional[List[str]] = []

    @validator('name', 'description')
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    @validator('website_url')
    def validate_url(cls, v):
        if v is not None and v.strip():
            if not v.startswith(('http://', 'https://')):
                raise ValueError('Website URL must start with http:// or https://')
        return v.strip() if v else None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    old_password: str
    new_password: str

    @validator('old_password', 'new_password')
    def password_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Password cannot be empty')
        return v.strip()

# Endpoints

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")
# Auth utilities
async def verify_token(authorization: str = Header(...), required_role: str = 'user') -> str:
    try:
        scheme, token = authorization.split()
        payload = jwt.decode(token, ACCESS_TOKEN_SECRET, algorithms=["HS256"])
        if payload.get('role') != required_role:
            raise HTTPException(status_code=403, detail="Not authorized")
        return payload['user_id']
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization token")

@app.get("/chatbots/{chatbot_id}/status")
async def get_chatbot_status(chatbot_id: str):
    return {"status": "online"}

#connect to external DB
@app.post("/connect-database")
async def connect_database(info: DBRequest, user_id: str = Depends(get_current_user)):
    try:
        uri = f"mysql+pymysql://{info.db_user}:{info.db_pass}@{info.db_host}/{info.db_name}"
        engine = create_engine(uri)
        conn = engine.connect()
        conn.close()
        return {"connected": True}
    except Exception as e:
        return JSONResponse(status_code=500, content={"connected": False, "error": str(e)})

# 🆕 Endpoint to fetch list of tables
@app.post("/fetch-tables")
async def fetch_tables(info: DBRequest, user_id: str = Depends(get_current_user)):
    try:
        uri = f"mysql+pymysql://{info.db_user}:{info.db_pass}@{info.db_host}/{info.db_name}"
        engine = create_engine(uri)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        return {"tables": tables}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/verify/{token}")
async def verify_email(token: str):
    print(f"🔍 Verifying token: {token}")
    
    result = supabase.table("users").select("*").eq("verification_token", token).limit(1).execute()
    user = result.data[0] if result.data else None

    if not user:
                check = supabase.table("users").select("id").eq("is_verified", True).execute()
                if any(u["id"] for u in check.data):
                    raise HTTPException(400, detail="This email has already been verified.")
                raise HTTPException(400, detail="Invalid or expired token.")

    # Mark user as verified
    supabase.table("users").update({
        "is_verified": True,
        "verification_token": None
    }).eq("id", user["id"]).execute()

    print(f"✅ User verified: {user['email']}")
    return {"message": "Email verified successfully"}




@app.post("/signup")
async def signup(req: SignupRequest):
    # Check if email already exists
    exists = supabase.table('users').select('id').eq('email', req.email).execute()
    if exists.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = pwd_context.hash(req.password)

    # Generate verification token
    verification_token = str(uuid4())

    # Prepare insert payload
    user_data = {
        'firstname': req.firstname,
        'lastname': req.lastname,
        'email': req.email,
        'password': hashed,
        'date': req.date,
        'role': req.role,  # 👈 Include role: 'user' or 'admin'
        'is_verified': False,
        'verification_token': verification_token,
        'last_password_change': None  # Explicitly set to None
    }

    try:
        print("🧪 User payload to insert:", user_data)
        resp = supabase.table('users').insert(user_data).execute()
        print("✅ Supabase insert response:", resp.data)


        # Send verification email
        
        verify_url = verification_token
        await send_verification_email(req.email, verification_token)

        return {
            "message": "User created. Please verify your email.",
            "user": resp.data,
            "token": verification_token
        }

    except APIError as e:
        raise HTTPException(status_code=500, detail=str(e))

    




@app.post("/login")
async def login(req: LoginRequest):
    try:
        # ✅ fetch id, password, role, and is_verified
        resp = (
            supabase
            .table("users")
            .select("id,password,role,is_verified")
            .eq("email", req.email)
            .execute()
        )
        
        # Check if user exists
        if not resp.data or len(resp.data) == 0:
            raise HTTPException(status_code=404, detail="Account not found")

        # Get the first user (should be only one since email is unique)
        user = resp.data[0]
        stored_hash = user["password"]
        
        # Check password
        if not pwd_context.verify(req.password, stored_hash):
            raise HTTPException(status_code=401, detail="Wrong password")

        # ✅ Check if the email is verified
        if not user.get("is_verified", False):
            raise HTTPException(status_code=401, detail="Account not verified")

        uid = user["id"]
        role = user["role"]
        now = datetime.utcnow()

        acc_payload = {
            "user_id": uid,
            "role": role,
            "exp": now + timedelta(hours=1)
        }
        access_token = jwt.encode(acc_payload, ACCESS_TOKEN_SECRET, algorithm="HS256")

        rid = str(uuid4())
        ref_payload = {
            "user_id": uid,
            "role": role,
            "token_id": rid,
            "exp": now + timedelta(days=7)
        }
        refresh_token = jwt.encode(ref_payload, REFRESH_TOKEN_SECRET, algorithm="HS256")

        supabase.table("refresh_tokens").insert({
            "token_id": rid,
            "user_id": uid,
            "role": role,
            "expires_at": ref_payload["exp"].isoformat()
        }).execute()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": role,
            "is_verified": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Unexpected login error")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/refresh")
async def refresh_token(req: RefreshTokenRequest):
    try:
        payload = jwt.decode(req.refresh_token, REFRESH_TOKEN_SECRET, algorithms=["HS256"])
        uid = payload["user_id"]
        tid = payload["token_id"]
        role = payload.get("role", "user")

        # ✅ All tokens are stored in one table now
        resp = (
            supabase
            .table("refresh_tokens")
            .select("token_id")
            .eq("token_id", tid)
            .eq("user_id", uid)
            .eq("role", role)
            .single()
            .execute()
        )

        if not resp.data:
            raise HTTPException(401, "Invalid refresh token")

        # ✅ Generate a new access token with same role
        new_payload = {
            "user_id": uid,
            "role": role,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        access_token = jwt.encode(new_payload, ACCESS_TOKEN_SECRET, algorithm="HS256")

        return {"access_token": access_token, "token_type": "bearer"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid refresh token")
    

@app.put("/searchbots/{searchbot_id}")
async def update_searchbot(searchbot_id: str, agent: Agent, user_id: str = Depends(get_current_user)):
    try:
        print("🛠️ UPDATE searchbot_id:", searchbot_id)
        print("🛠️ USER_ID:", user_id)
        print("🛠️ Payload:", agent.dict())

        updated_data = agent.dict()
        updated_data["user_id"] = user_id
        updated_data["allowed_tables"] = ",".join(agent.allowed_tables or [])
        updated_data["updated_at"] = datetime.utcnow().isoformat()

        resp = supabase.table("searchbots").update(updated_data).eq("id", searchbot_id).eq("user_id", user_id).execute()
        print("✅ Supabase update response:", resp)
        return {"updated": True}
    except Exception as e:
        print("❌ Error during searchbot update:", str(e))
        raise HTTPException(500, str(e))

from urllib.parse import urlparse
from langdetect import detect
from llm_utils import get_llm, get_rag_chain

@app.post("/chatbot/chat/{chatbot_id}")
async def chat_with_bot(chatbot_id: str, request: Request):
    try:
        raw_body = await request.body()
        print(f"📦 Raw request body: {raw_body}")

        try:
            data = await request.json()
            query = data.get("message", "").strip()
            if not query:
                raise ValueError("Missing 'message' in request body")
        except Exception as e:
            print(f"❌ Invalid JSON body: {str(e)}")
            raise HTTPException(422, "Invalid or missing JSON body with 'message'")

        print(f"🔍 Chat request for chatbot {chatbot_id}")
        print(f"📝 Query: {query}")

        # Fetch chatbot settings from Supabase
        try:
            chatbot = supabase.table('chatbots').select('*').eq('id', chatbot_id).single().execute()
            if not chatbot.data:
                raise HTTPException(404, "Chatbot not found")
            chatbot_data = chatbot.data
            print(f"✅ Found chatbot: {chatbot_data}")
        except Exception as e:
            print(f"❌ Error fetching chatbot: {str(e)}")
            raise HTTPException(500, "Error accessing chatbot")

        # LLM configuration
        temperature = chatbot_data.get("temperature", 0.7)
        max_tokens = chatbot_data.get("max_tokens", 1000)
        model = chatbot_data.get("model", "mistralai/mistral-7b-instruct:free")
        print(f"🧠 LLM config: model={model}, temp={temperature}, max_tokens={max_tokens}")

        # Utility: extract support email
        def get_support_email(website_url: str) -> str:
            try:
                domain = urlparse(website_url).netloc or "example.com"
                return f"support@{domain}"
            except:
                return "support@example.com"

        # Detect user language
        def get_user_language(text: str) -> str:
            try:
                return detect(text)
            except:
                return "en"

        # Match greetings
        def is_greeting(text: str) -> bool:
            greetings = {"hello", "hi", "hey", "bonjour", "salut", "yo", "hola", "السلام", "مرحبا"}
            return text.lower().strip() in greetings

        lang = get_user_language(query)
        print(f"🌍 Detected language: {lang}")

        support_email = get_support_email(chatbot_data.get("website_url", ""))
        fallback_messages = {
            "fr": f"❗ Je suis désolé, je ne dispose pas de cette information. Veuillez contacter le support du site : {support_email}",
            "en": f"❗ I'm sorry, I don't have this information. Please contact our website support: {support_email}",
            "ar": f"❗ عذرًا، لا أمتلك هذه المعلومة. يُرجى التواصل مع دعم الموقع: {support_email}"
        }
        fallback_msg = fallback_messages.get(lang, fallback_messages["en"])

        # Greeting shortcut
        if is_greeting(query):
            return {
                "answer": chatbot_data.get("greeting_message", "Bonjour ! Comment puis-je vous aider ? 😊"),
                "sources": []
            }

        # Vectorstore setup
        collection_name = f"chatbot_{chatbot_id}"
        print(f"📚 Using collection: {collection_name}")

        try:
            qdrant = get_qdrant_client()
            collections = qdrant.get_collections().collections
            if not any(col.name == collection_name for col in collections):
                raise HTTPException(404, "Chatbot documents not found. Please upload documents first.")
            vectorstore = get_vectorstore(qdrant, collection_name)
            print("✅ Vectorstore ready")
        except Exception as e:
            print(f"❌ Error preparing vectorstore: {str(e)}")
            raise HTTPException(500, "Vectorstore setup failed")

        try:
            llm = get_llm(temperature=temperature, max_tokens=max_tokens, model=model)
            print("✅ LLM initialized")

            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 3, "score_threshold": 0.5}
            )
            print("✅ Retriever ready")

            docs = retriever.get_relevant_documents(query)
            if not docs or all(not doc.page_content.strip() for doc in docs):
                return {
                    "answer": fallback_msg,
                    "sources": []
                }

            context = "\n\n".join(doc.page_content for doc in docs if doc.page_content.strip())
            rag_chain = get_rag_chain(llm, context, query, chatbot_data.get("website_url", ""))
            answer = rag_chain.invoke({})

            return {
                "answer": answer,
                "sources": [doc.page_content for doc in docs]
            }

        except Exception as e:
            print(f"❌ Error during RAG processing: {str(e)}")
            return {
                "answer": fallback_msg,
                "sources": []
            }

    except HTTPException as he:
        print(f"❌ HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(500, f"Unhandled error: {str(e)}")


    except HTTPException as he:
        print(f"❌ HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(500, f"Unhandled error: {str(e)}")



@app.put("/chatbots/{chatbot_id}")
async def update_chatbot(
    chatbot_id: str,
    name: str = Form(...),
    description: str = Form(...),
    greeting_message: str = Form(...),
    prompt: str = Form(...),
    temperature: float = Form(...),
    max_tokens: int = Form(...),
    model: str = Form(...),
    website_url: Optional[str] = Form(None),
    existing_files: str = Form("[]"),
    files: List[UploadFile] = File([]),
    user_id: str = Depends(get_current_user)
):
    try:
        print("🛠️ UPDATE chatbot_id:", chatbot_id)
        print("🛠️ USER_ID:", user_id)

        # Step 1: Parse existing file paths
        existing_file_list = json.loads(existing_files)
        all_files = []

        # Step 2: Save new files
        pdf_dir = "uploaded_pdfs"
        os.makedirs(pdf_dir, exist_ok=True)
        new_chunks = []

        for file in files:
            filename = f"{uuid4()}_{file.filename}"
            file_path = os.path.join(pdf_dir, filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            all_files.append(file_path)

            ext = os.path.splitext(file.filename)[1].lower()
            if ext == ".pdf":
                new_chunks += load_and_split_pdf(file_path)
            elif ext == ".xml":
                from document_loader import load_and_split_xml
                new_chunks += load_and_split_xml(file_path)

        # Add kept old files
        all_files.extend(existing_file_list)

        # Step 3: Update Supabase metadata
        update_data = {
            "name": name,
            "description": description,
            "greeting_message": greeting_message,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "website_url": website_url,
            "pdf_paths": all_files,
            "updated_at": datetime.utcnow().isoformat()
        }

        resp = supabase.table("chatbots").update(update_data).eq("id", chatbot_id).eq("user_id", user_id).execute()
        if not resp.data:
            raise HTTPException(404, "Chatbot not found or not yours.")

        # Step 4: Regenerate embeddings if any change in files
        original_files = set(existing_file_list)
        updated_files = set(all_files)
        if original_files != updated_files or files:
            print("🧹 Files changed, re-creating vectorstore")

            qdrant = get_qdrant_client()
            collection_name = f"chatbot_{chatbot_id}"

            # Delete old collection
            try:
                qdrant.delete_collection(collection_name=collection_name)
            except Exception as e:
                print(f"⚠️ Couldn't delete old collection: {e}")

            # Recreate
            try:
                create_agent(qdrant, str(chatbot_id))
            except Exception as e:
                raise HTTPException(500, f"Failed to recreate agent: {str(e)}")

            # Optional: scrape site
            scraped_chunks = []
            if website_url:
                try:
                    scraped_chunks = scrape_website(website_url)
                except Exception as e:
                    print(f"⚠️ Failed scraping site: {e}")

            all_chunks = new_chunks + scraped_chunks
            vectorstore = get_vectorstore(qdrant, collection_name)

            for i in range(0, len(all_chunks), 5):
                batch = all_chunks[i:i + 5]
                try:
                    vectorstore.add_documents(batch)
                    print(f"✅ Processed batch {i//5 + 1}")
                except Exception as e:
                    print(f"⚠️ Batch {i//5 + 1} error: {str(e)}")

        return {"updated": True, "chatbot": resp.data[0]}

    except Exception as e:
        print("❌ Error during chatbot update:", str(e))
        raise HTTPException(500, str(e))
    
@app.get("/chatbots/{chatbot_id}")
async def get_chatbot(chatbot_id: int):
    try:
        print(f"🔍 Fetching public chatbot {chatbot_id}")
        
        # Just check if the chatbot exists by ID (no user check)
        response = supabase.table("chatbots").select("*").eq("id", chatbot_id).single().execute()
        
        if not response.data:
            print(f"❌ Chatbot {chatbot_id} not found")
            raise HTTPException(
                status_code=404, 
                detail="Chatbot not found"
            )
        
        # Clean and format the chatbot data
        chatbot_data = response.data
        
        # Format pdf_paths if it's a string
        if chatbot_data.get("pdf_paths"):
            if isinstance(chatbot_data["pdf_paths"], str):
                chatbot_data["pdf_paths"] = [
                    path.strip() for path in chatbot_data["pdf_paths"].split(",") if path.strip()
                ]
        
        # Format allowed_tables if it's a string
        if chatbot_data.get("allowed_tables"):
            if isinstance(chatbot_data["allowed_tables"], str):
                chatbot_data["allowed_tables"] = [
                    table.strip() for table in chatbot_data["allowed_tables"].split(",") if table.strip()
                ]
        
        print(f"✅ Successfully fetched chatbot data: {chatbot_data}")
        return {"chatbot": chatbot_data}

    except HTTPException as he:
        print(f"❌ HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"❌ Error fetching chatbot: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/chatbot/embed/{chatbot_id}", response_class=HTMLResponse)
async def serve_chatbot_embed(chatbot_id: str):
    index_path = os.path.join(frontend_dist_dir, "index.html")
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html_content = f.read().replace("{{CHATBOT_ID}}", chatbot_id)
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Embed page not found</h1>", status_code=404)
    
@app.delete("/searchbots/{searchbot_id}")
async def delete_searchbot(searchbot_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table("searchbots").delete().eq("id", searchbot_id).eq("user_id", user_id).execute()
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(500, str(e))




@app.get("/chatbots")
async def get_chatbots(user_id: str = Depends(get_current_user)):
    print("🔍 User ID:", user_id)  # <== Add this line
    resp = supabase.table('chatbots').select('*').eq('user_id', user_id).execute()
    return resp.data

@app.get("/searchbots")
async def get_searchbots(user_id: str = Depends(get_current_user)):
    resp = supabase.table('searchbots').select('*').eq('user_id', user_id).execute()
    return resp.data

@app.post("/searchbot/chat/{searchbot_id}")
async def chat_with_searchbot(searchbot_id: str, request: ChatRequest):
    return await handle_search_query(searchbot_id, request)
#create searchbot
@app.post("/searchbot")
async def create_searchbot(agent: Agent, user_id: str = Depends(get_current_user)):
    try:
        print("📦 Incoming searchbot data:", agent.dict())
        data = agent.dict()
        data["user_id"] = user_id

        # ✅ DO NOT JOIN — send it directly as a list if it's already a list
        if not agent.allowed_tables:
            data["allowed_tables"] = []
        
        resp = supabase.table("searchbots").insert(data).execute()
        print("✅ Supabase insert response:", resp)
        return {"message": "Searchbot created", "id": resp.data[0]["id"]}
    except Exception as e:
        print("❌ Failed to create searchbot:", str(e))
        raise HTTPException(500, str(e))




@app.post("/chatbot/db")
async def create_chatbot_db(agent: Agent, user_id: str = Depends(get_current_user)):
    data = agent.dict()
    data['user_id'] = user_id
    try:
        resp = supabase.table("chatbots").insert(data).execute()
        return {"message": "Chatbot with DB created", "id": resp.data[0]['id']}
    except Exception as e:
        raise HTTPException(500, str(e))


# Create chatbot
@app.post("/chatbot/pdf")
async def create_chatbot_from_pdf(
    name: str = Form(...),
    description: str = Form(...),
    greeting_message: str = Form("Hello! How can I help you today?"),
    prompt: str = Form("You are a helpful AI assistant. Use the provided context to answer questions accurately and concisely."),
    temperature: float = Form(0.8),
    max_tokens: int = Form(100),
    model: str = Form("mistralai/mistral-7b-instruct:free"),
    files: List[UploadFile] = File(...),
    website_url: Optional[str] = Form(None),  
    user_id: str = Depends(get_current_user)
):
    try:
        print("🟢 /chatbot/pdf called with:", name, description)

        # Step 1: Save uploaded PDF
        pdf_dir = "uploaded_pdfs"
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_paths = []

        for file in files:
            filename = f"{uuid4()}_{file.filename}"
            path = os.path.join(pdf_dir, filename)
            with open(path, "wb") as f:
                f.write(await file.read())
            pdf_paths.append(path)

        # Step 2: Insert chatbot metadata into Supabase (to get chatbot_id)
        print("🛠 Inserting chatbot metadata to Supabase...")
        resp = supabase.table("chatbots").insert({
            "name": name,
            "description": description,
            "greeting_message": greeting_message,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "user_id": user_id,
            "pdf_paths": pdf_paths,
            "website_url": website_url
        }).execute()

        chatbot_id = resp.data[0]["id"]
        collection_name = f"chatbot_{chatbot_id}"

        # Step 3: Initialize Qdrant client
        print("🔧 Initializing Qdrant client...")
        qdrant = get_qdrant_client()

        # Step 4: Create agent and collection
        print("🤖 Creating agent and collection...")
        try:
            create_agent(qdrant, str(chatbot_id))
            print("✅ Agent and collection created successfully")
        except Exception as e:
            print(f"⚠️ Error creating agent/collection: {str(e)}")
            # If collection already exists, that's fine - we'll use it
            if "already exists" not in str(e).lower():
                raise HTTPException(500, f"Error creating agent: {str(e)}")

        # Step 5: Load + split PDF into chunks
        print("📄 Loading and splitting files...")
        chunks = []
        for path in pdf_paths:
            ext = os.path.splitext(path)[1].lower()
            print(f"📂 Processing file: {path} as {ext}")
            try:
                if ext == ".pdf":
                    chunks.extend(load_and_split_pdf(path))
                elif ext == ".xml":
                    from document_loader import load_and_split_xml
                    chunks.extend(load_and_split_xml(path))
                else:
                    print(f"⚠️ Skipping unsupported file: {path}")
            except Exception as e:
                print(f"❌ Error loading {path}: {str(e)}")
                raise HTTPException(500, f"Failed to load and split {path}: {str(e)}")
        scraped_chunks = [] 
        if website_url:
            try:
                print(f"🌐 Scraping website: {website_url}")
                scraped_chunks = scrape_website(website_url)
                print(f"✅ Scraped {len(scraped_chunks)} chunks")
            except Exception as e:
                print(f"⚠️ Failed to scrape site: {e}")

        # Step 6: Store embeddings
        all_chunks = chunks + scraped_chunks
        print(f"📦 Total chunks to process: {len(all_chunks)}")
        vectorstore = get_vectorstore(qdrant, collection_name)
 
        # Process chunks in batches to avoid timeouts
        BATCH_SIZE = 5  # Reduced batch size
        
        
        try:
            for i in range(0, len(all_chunks), BATCH_SIZE):
                batch = all_chunks[i:i + BATCH_SIZE]
                print(f"🔄 Processing batch {i//BATCH_SIZE + 1}/{(len(all_chunks) + BATCH_SIZE - 1)//BATCH_SIZE}")
                try:
                    vectorstore.add_documents(batch)
                    print(f"✅ Processed batch {i//BATCH_SIZE + 1}")
                except asyncio.TimeoutError:
                    print(f"⚠️ Batch {i//BATCH_SIZE + 1} timed out, but continuing with next batch")
                    continue
                except Exception as e:
                    print(f"⚠️ Error processing batch {i//BATCH_SIZE + 1}: {str(e)}")
                    continue

            # Update chatbot metadata in Supabase
            print("✅ All batches processed, updating metadata")
            supabase.table("chatbots").update({
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", chatbot_id).execute()

        except Exception as e:
            print(f"❌ Error during vectorization: {str(e)}")
            return {
                "status": "partial_success",
                "message": "Agent created but PDF processing is still in progress",
                "id": chatbot_id,
                "collection": collection_name
            }

        # Step 7: Return success response
        return {
            "message": "Chatbot created successfully",
            "id": chatbot_id,
            "collection": collection_name,
            "embed_code": f"<iframe src='http://localhost:8000/chatbot/embed/{chatbot_id}' width='100%' height='600px'></iframe>"
        }

    except Exception as e:
        print(f"❌ Error creating chatbot: {str(e)}")
        # If we get here, something went wrong before we could create the chatbot
        raise HTTPException(500, f"Failed to create chatbot: {str(e)}")



# UPDATE CURRENT LOGGED-IN USER
@app.put("/users/me")
async def update_current_user(req: UserSettingsUpdateRequest, user_id: str = Depends(get_current_user)):
    try:
        print(f"🔄 Updating user {user_id} with data:", req.dict())

        # Get user from unified 'users' table
        user_data = supabase.table('users').select('*').eq('id', user_id).single().execute()
        print("📊 User data from DB:", user_data)

        if not user_data.data:
            raise HTTPException(404, "User not found")

        stored_hash = user_data.data['password']
        if not pwd_context.verify(req.password, stored_hash):
            raise HTTPException(403, "Incorrect password")

        update_data = {
            'firstname': req.firstname,
            'lastname': req.lastname,
            'email': req.email,
            'updated_at': datetime.utcnow().isoformat()
        }

        updated = supabase.table('users').update(update_data).eq('id', user_id).execute()

        if not updated.data:
            raise HTTPException(500, "Failed to update user data")

        return {
            "message": "User updated successfully",
            "user": {
                "id": user_id,
                "firstname": req.firstname,
                "lastname": req.lastname,
                "email": req.email
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(500, f"Unexpected error: {str(e)}") 
    
@app.get("/users/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    user_data = supabase.table('users').select('firstname, lastname, email, date').eq('id', user_id).single().execute()
    if not user_data.data:
        raise HTTPException(404, "User not found")
    return user_data.data


# GET ALL USERS (admin only)
@app.get("/users", dependencies=[Depends(get_current_admin)])
async def list_users():
    resp = supabase.table('users').select('*').execute()
    return resp.data

# GET SINGLE USER (admin only)
@app.get("/users/{user_id}", dependencies=[Depends(get_current_admin)])
async def get_user(user_id: str):
    resp = supabase.table('users').select('*').eq('id', user_id).single().execute()
    return resp.data

# UPDATE ANY USER (admin only)
@app.put("/users/{user_id}", dependencies=[Depends(get_current_admin)])
async def update_user(user_id: str, user_update: UserUpdate):
    try:
        # Filter out None values from the update data so only provided fields are updated
        update_data = user_update.dict(exclude_unset=True)
        print(f"🔄 Updating user {user_id} with data: {update_data}")
        resp = supabase.table('users').update(update_data).eq('id', user_id).execute()
        print(f"✅ Supabase update response: {resp.data}")
        if not resp.data:
            raise HTTPException(404, "User not found or no changes made")
        return resp.data[0]
    except Exception as e:
        print(f"❌ Error updating user {user_id}: {str(e)}")
        raise HTTPException(500, str(e))


@app.delete("/users/{user_id}", dependencies=[Depends(get_current_admin)])
async def delete_user(user_id: str):
    try:
        # Delete all refresh tokens
        supabase.table('refresh_tokens').delete().eq('user_id', user_id).execute()
        # Delete chatbots and searchbots
        supabase.table('chatbots').delete().eq('user_id', user_id).execute()
        supabase.table('searchbots').delete().eq('user_id', user_id).execute()
        # Delete user from 'users'
        supabase.table('users').delete().eq('id', user_id).execute()
        return {"deleted": True}
    except Exception as e:
        print(f"❌ Failed to delete user {user_id}: {str(e)}")
        raise HTTPException(500, str(e))

@app.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    try:
        # Check if email exists and get last password change time
        user = supabase.table('users').select('id, last_password_change').eq('email', request.email).single().execute()
        
        if not user.data:
            # Don't reveal if email exists or not for security
            return {"message": "If your email is registered, you will receive a password reset link"}

        # Check if user changed password in last 8 hours
        if user.data.get('last_password_change'):
            last_change = datetime.fromisoformat(user.data['last_password_change'])
            current_time = datetime.now(last_change.tzinfo)
            time_since_last_change = current_time - last_change
            
            if time_since_last_change < timedelta(hours=8):
                hours_remaining = 8 - (time_since_last_change.total_seconds() / 3600)
                raise HTTPException(400, f"You can change your password only one time every 8 hours. Please try again in {hours_remaining:.1f} hours.")

        # Generate reset token
        reset_token = str(uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)

        # Store reset token
        supabase.table('password_resets').insert({
            'user_id': user.data['id'],
            'token': reset_token,
            'expires_at': expires_at.isoformat()
        }).execute()

        # Send reset email
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password/{reset_token}"
        
        await send_password_reset_email(request.email, reset_link)

        return {"message": "If your email is registered, you will receive a password reset link"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in forgot password: {str(e)}")
        raise HTTPException(500, "Internal server error")

@app.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    try:
        print(f"🔍 Attempting to reset password with token: {request.token}")
        print(f"🔍 Request data: {request.dict()}")
        
        # Validate token format
        if not request.token or len(request.token) < 10:
            print("❌ Invalid token format")
            raise HTTPException(400, "Invalid token format")

        # Validate password strength
        if len(request.new_password) < 6:
            print("❌ Password too short")
            raise HTTPException(400, "Password must be at least 6 characters long")

        # Find valid reset token
        try:
            print("🔍 Querying password_resets table...")
            reset_data = supabase.table('password_resets').select('*').eq('token', request.token).single().execute()
            print(f"🔍 Reset data response: {reset_data}")
        except Exception as e:
            print(f"❌ Database error while fetching token: {str(e)}")
            print(f"❌ Error type: {type(e)}")
            print(f"❌ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
            raise HTTPException(500, "Error validating reset token")
        
        if not reset_data.data:
            print("❌ No reset token found")
            raise HTTPException(400, "Invalid or expired reset token")

        # Check if token is expired
        try:
            print(f"🔍 Checking token expiration. Expires at: {reset_data.data['expires_at']}")
            expires_at = datetime.fromisoformat(reset_data.data['expires_at'])
            # Make current time timezone-aware
            current_time = datetime.now(expires_at.tzinfo)
            print(f"🔍 Current time: {current_time}")
            if current_time > expires_at:
                print("❌ Token expired")
                raise HTTPException(400, "Reset token has expired")
        except ValueError as e:
            print(f"❌ Invalid date format: {str(e)}")
            raise HTTPException(500, "Invalid token expiration date")

        # Check if token has been used
        if reset_data.data.get('used', False):
            print("❌ Token already used")
            raise HTTPException(400, "Reset token has already been used")

        # Get user's current password and last password change time
        try:
            user_data = supabase.table('users').select('password, last_password_change').eq('id', reset_data.data['user_id']).single().execute()
            if not user_data.data:
                raise HTTPException(404, "User not found")
            
            # Verify old password
            if not pwd_context.verify(request.old_password, user_data.data['password']):
                raise HTTPException(400, "Incorrect old password")

            # Check if enough time has passed since last password change
            if user_data.data.get('last_password_change'):
                last_change = datetime.fromisoformat(user_data.data['last_password_change'])
                time_since_last_change = current_time - last_change
                if time_since_last_change < timedelta(hours=8):
                    hours_remaining = 8 - (time_since_last_change.total_seconds() / 3600)
                    raise HTTPException(400, f"You can change your password only one time every 8 hours. Please try again in {hours_remaining:.1f} hours.")

        except Exception as e:
            print(f"❌ Error verifying old password: {str(e)}")
            raise HTTPException(500, "Error verifying old password")

        # Hash new password
        try:
            print("🔍 Hashing new password...")
            hashed_password = pwd_context.hash(request.new_password)
            print("✅ Password hashed successfully")
        except Exception as e:
            print(f"❌ Error hashing password: {str(e)}")
            raise HTTPException(500, "Error processing password")

        # Update user's password and last_password_change
        print(f"🔄 Updating password for user: {reset_data.data['user_id']}")
        try:
            # Make sure we use timezone-aware datetime
            current_time = datetime.now(expires_at.tzinfo)
            update_data = {
                'password': hashed_password,
                'last_password_change': current_time.isoformat(),  # Set only when password is changed
                'updated_at': current_time.isoformat()
            }
            print(f"🔍 Update data: {update_data}")
            update_result = supabase.table('users').update(update_data).eq('id', reset_data.data['user_id']).execute()
            print(f"🔍 Update result: {update_result}")

            if not update_result.data:
                print("❌ Failed to update user password")
                raise HTTPException(500, "Failed to update password")
        except Exception as e:
            print(f"❌ Database error while updating password: {str(e)}")
            print(f"❌ Error type: {type(e)}")
            print(f"❌ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
            raise HTTPException(500, "Error updating password")

        # Mark token as used and invalidate it
        print("✅ Marking token as used and invalidating it")
        try:
            update_data = {
                'used': True,
                'updated_at': current_time.isoformat(),
                'token': f"USED_{request.token}_{current_time.timestamp()}"  # Invalidate the token by changing it
            }
            print(f"🔍 Token update data: {update_data}")
            token_update = supabase.table('password_resets').update(update_data).eq('token', request.token).execute()
            print(f"🔍 Token update result: {token_update}")
        except Exception as e:
            print(f"⚠️ Warning: Failed to mark token as used: {str(e)}")
            print(f"⚠️ Error type: {type(e)}")
            print(f"⚠️ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
            # Don't raise error here as password was already updated

        print("✅ Password reset successful")
        return {
            "message": "Password has been reset successfully",
            "status": "success"
        }

    except HTTPException as he:
        print(f"❌ HTTP Exception: {str(he)}")
        print(f"❌ Status code: {he.status_code}")
        print(f"❌ Detail: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ Unexpected error in reset_password: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
        raise HTTPException(500, "An unexpected error occurred while resetting your password")

@app.delete("/chatbots/{chatbot_id}")
async def delete_chatbot(chatbot_id: str, user_id: str = Depends(get_current_user)):
    try:
        print(f"🗑️ Deleting chatbot {chatbot_id} for user {user_id}")
        
        # Step 1: Verify chatbot ownership
        chatbot = supabase.table("chatbots").select("*").eq("id", chatbot_id).eq("user_id", user_id).single().execute()
        if not chatbot.data:
            raise HTTPException(404, "Chatbot not found or you don't have permission to delete it")

        # Step 2: Delete Qdrant collection
        try:
            collection_name = f"chatbot_{chatbot_id}"
            qdrant = get_qdrant_client()
            qdrant.delete_collection(collection_name=collection_name)
            print(f"✅ Deleted Qdrant collection: {collection_name}")
        except Exception as e:
            print(f"⚠️ Error deleting Qdrant collection: {str(e)}")
            # Continue with deletion even if Qdrant deletion fails

        # Step 3: Delete PDF files
        try:
            pdf_paths = chatbot.data.get("pdf_paths", [])
            if isinstance(pdf_paths, str):
                pdf_paths = pdf_paths.split(",")
            
            for path in pdf_paths:
                if os.path.exists(path):
                    os.remove(path)
                    print(f"✅ Deleted PDF file: {path}")
        except Exception as e:
            print(f"⚠️ Error deleting PDF files: {str(e)}")
            # Continue with deletion even if file deletion fails

        # Step 4: Delete from Supabase
        resp = supabase.table("chatbots").delete().eq("id", chatbot_id).eq("user_id", user_id).execute()
        if not resp.data:
            raise HTTPException(500, "Failed to delete chatbot from database")

        print(f"✅ Successfully deleted chatbot {chatbot_id}")
        return {"deleted": True, "message": "Chatbot and associated data deleted successfully"}

    except HTTPException as he:
        print(f"❌ HTTP Exception: {str(he)}")
        raise he
    except Exception as e:
        print(f"❌ Error deleting chatbot: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        print(f"❌ Error details: {e.__dict__ if hasattr(e, '__dict__') else 'No details available'}")
        raise HTTPException(500, f"Error deleting chatbot: {str(e)}")

