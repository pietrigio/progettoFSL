from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from rag import retrieve_docs, generate_answer
import json
import os

app = FastAPI()

# ===== CORS (OBBLIGATORIO PER REACT) =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== PATH FILE =====
DATA_DIR = "data"
CHAT_FILE = os.path.join(DATA_DIR, "chats.json")

os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(CHAT_FILE):
    with open(CHAT_FILE, "w") as f:
        json.dump([], f)

# ===== MODELLI =====
class Message(BaseModel):
    role: str
    text: str

class Chat(BaseModel):
    id: int
    title: str
    messages: List[Message]

# ===== FUNZIONI FILE =====
def read_chats():
    with open(CHAT_FILE, "r") as f:
        return json.load(f)

def write_chats(chats):
    with open(CHAT_FILE, "w") as f:
        json.dump(chats, f, indent=2)

# ===== API =====

@app.get("/chats")
def get_chats():
    return read_chats()

@app.post("/chats")
def save_chat(chat: Chat):
    chats = read_chats()

    for i, c in enumerate(chats):
        if c["id"] == chat.id:
            chats[i] = chat.dict()
            break
    else:
        chats.insert(0, chat.dict())

    write_chats(chats)
    return {"ok": True}


from fastapi import WebSocket
import asyncio

@app.websocket("/ws")
async def websocket_chat(ws: WebSocket):
    await ws.accept()

    while True:
        data = await ws.receive_json()
        question = data["question"]

        # risposta simulata (come ChatGPT streaming)
        docs = retrieve_docs(question)
        response = generate_answer(question, docs)

        for char in response:
            await ws.send_text(char)
            await asyncio.sleep(0.03)

        await ws.send_text("__END__")
