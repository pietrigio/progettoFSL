# --------------------
# SIMPLE RAG BACKEND WITH SEPARATE EMBEDDING & GENERATIVE MODELS
# --------------------

from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from langchain_chroma import Chroma
from nomic import Embedder
import os, json, shutil
import ollama

# --------------------
# APP SETUP
# --------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# PATHS
# --------------------

DATA_DIR = "data"
INDEX_DIR = os.path.join(DATA_DIR, "indexes")
UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
CHAT_FILE = os.path.join(DATA_DIR, "chats.json")

os.makedirs(INDEX_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

if not os.path.exists(CHAT_FILE):
    with open(CHAT_FILE, "w") as f:
        json.dump([], f)

# --------------------
# EMBEDDINGS & VECTOR STORE (nomic-embed-text)
# --------------------

# Initialize Nomic embedder
nomic_embedder = Embedder()

def embeddings(texts: list[str]) -> list[list[float]]:
    return [nomic_embedder.embed_text(t) for t in texts]

# Dictionary to hold Chroma collections
vector_stores = {}

def get_vector_store(collection_name: str):
    if collection_name not in vector_stores:
        persist_dir = os.path.join(INDEX_DIR, collection_name)
        os.makedirs(persist_dir, exist_ok=True)
        vector_stores[collection_name] = Chroma(
            collection_name=collection_name,
            embedding_function=embeddings,
            persist_directory=persist_dir
        )
    return vector_stores[collection_name]

# --------------------
# MODELS
# --------------------

class Message(BaseModel):
    role: str
    text: str

class Chat(BaseModel):
    id: int
    title: str
    messages: List[Message]

class IndexCreate(BaseModel):
    name: str

class SearchRequest(BaseModel):
    index: str
    question: str

# --------------------
# CHAT ENDPOINTS
# --------------------

def read_chats():
    with open(CHAT_FILE, "r") as f:
        return json.load(f)

def write_chats(data):
    with open(CHAT_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.get("/chats")
def get_chats():
    return read_chats()

@app.post("/chats")
def save_chat(chat: Chat):
    chats = read_chats()
    chats = [c for c in chats if c["id"] != chat.id]
    chats.insert(0, chat.dict())
    write_chats(chats)
    return {"ok": True}

@app.delete("/chat/{chat_id}")
def delete_chat(chat_id: int):
    chats = read_chats()
    chats = [c for c in chats if c["id"] != chat_id]
    write_chats(chats)
    return {"ok": True}

# --------------------
# WEBSOCKET (Generative Model: llama3)
# --------------------

OLLAMA_BASE_URL = "http://localhost:11434"

@app.websocket("/ws")
async def websocket_chat(ws: WebSocket):
    await ws.accept()
    while True:
        data = await ws.receive_json()
        question = data["question"]

        # Use generative model
        response = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": question}],
            base_url=OLLAMA_BASE_URL
        )

        await ws.send_text(response["message"]["content"])
        await ws.send_text("__END__")

# --------------------
# INDEX ENDPOINTS
# --------------------

@app.get("/indexes")
def get_indexes():
    return list(vector_stores.keys())

@app.post("/create-index")
def create_index(data: IndexCreate):
    get_vector_store(data.name)
    os.makedirs(os.path.join(INDEX_DIR, data.name, "files"), exist_ok=True)
    return {"ok": True}

@app.delete("/index/{index_name}")
def delete_index(index_name: str):
    if index_name in vector_stores:
        vector_stores.pop(index_name)
    shutil.rmtree(os.path.join(INDEX_DIR, index_name), ignore_errors=True)
    return {"ok": True}

# --------------------
# FILE ENDPOINTS
# --------------------

@app.get("/files/{index_name}")
def get_files(index_name: str):
    path = os.path.join(INDEX_DIR, index_name, "files")
    if not os.path.exists(path):
        return []
    return os.listdir(path)

@app.post("/upload-file/{index_name}")
async def upload_file(index_name: str, file: UploadFile = File(...)):
    vector_store = get_vector_store(index_name)

    save_path = os.path.join(INDEX_DIR, index_name, "files", file.filename)
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)

    text = content.decode("utf-8", errors="ignore")

    # Add to vector store
    vector_store.add(documents=[text], ids=[file.filename])

    return {"ok": True}

@app.delete("/index/{index_name}/{filename}")
def delete_file(index_name: str, filename: str):
    vector_store = get_vector_store(index_name)
    vector_store.delete(ids=[filename])

    file_path = os.path.join(INDEX_DIR, index_name, "files", filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    return {"ok": True}

# --------------------
# DOWNLOAD & READ FILE
# --------------------

@app.get("/download/{index_name}/{filename}")
def download_file(index_name: str, filename: str):
    path = os.path.join(INDEX_DIR, index_name, "files", filename)
    if not os.path.exists(path):
        return {"error": "Not found"}
    return FileResponse(path, filename=filename)

@app.get("/file-content/{index_name}/{filename}")
def file_content(index_name: str, filename: str):
    path = os.path.join(INDEX_DIR, index_name, "files", filename)
    if not os.path.exists(path):
        return {"error": "Not found"}
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return {"content": f.read()}

# --------------------
# RAG SEARCH (Embeddings + Generative Model)
# --------------------

@app.post("/search-files")
def search_files(data: SearchRequest):
    vector_store = get_vector_store(data.index)

    # Get top 3 relevant documents
    results = vector_store.query(
        query_texts=[data.question],
        n_results=3
    )

    docs = results["documents"][0] if results["documents"] else []
    context = "\n\n".join(docs)

    # Use generative model for final answer
    prompt = f"""
    Use the context to answer the question.

    Context:
    {context}

    Question:
    {data.question}
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}],
        base_url=OLLAMA_BASE_URL
    )

    return {
        "answer": response["message"]["content"],
        "sources": results["ids"][0] if results["ids"] else []
    }
