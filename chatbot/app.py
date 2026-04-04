import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from chat import DocumentChatbot

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Use app.state instead of a bare global
    try:
        pdf_path = os.getenv(
            'PDF_PATH',
            r"C:\Ankita-new\Project1\chatbot\Sahayak_RAG_Policy_Guidelines.pdf",
        )
        logger.info(f"Loading chatbot from: {pdf_path}")
        app.state.chatbot = DocumentChatbot(pdf_path=pdf_path)
        logger.info("✅ Chatbot initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize chatbot: {e}")
        raise
    yield
    # Cleanup on shutdown (optional)
    app.state.chatbot = None

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:5173",  # ✅ Added — Vite sometimes uses 127.0.0.1
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    user_message: str
    session_id: str = "default"

@app.get("/")
async def health_check(request: Request):
    chatbot = getattr(request.app.state, "chatbot", None)
    return {"status": "ok", "chatbot_loaded": chatbot is not None}

@app.post("/chat")
async def chat_with_ai(input_data: ChatInput, request: Request):
    # ✅ Read from app.state — always reliable in async context
    chatbot = getattr(request.app.state, "chatbot", None)
    
    if chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized. Check server logs.")
    
    if not input_data.user_message.strip():
        raise HTTPException(status_code=400, detail="user_message cannot be empty.")

    try:
        logger.info(f"Session [{input_data.session_id}] → {input_data.user_message}")
        answer = chatbot.ask(
            session_id=input_data.session_id,
            question=input_data.user_message
        )
        logger.info(f"Session [{input_data.session_id}] ← {answer[:80]}...")
        return {"bot_response": answer}
    except Exception as e:
        logger.error(f"Chat error for session [{input_data.session_id}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # ✅ reload=True breaks lifespan — use False, or run via CLI with --reload
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)