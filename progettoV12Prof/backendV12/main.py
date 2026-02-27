from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import json, os
import fitz

from rag import (
    create_index,
    list_indexes,
    add_file_to_index,
    list_files,
    load_index_chat,
    save_index_chat,
    retrieve_docs,
    delete_index,
    delete_file_from_index
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)



DATA_DIR = "data"
CHAT_FILE = os.path.join(DATA_DIR, "chats.json")


if not os.path.exists(CHAT_FILE):
    with open(CHAT_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)


# =========================================================
# CHAT NORMALE (invariata)
# =========================================================

class Message(BaseModel):
    role: str
    text: str

class Chat(BaseModel):
    id: int
    title: str
    messages: List[Message]

def read_chats():
    with open(CHAT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def write_chats(chats):
    with open(CHAT_FILE, "w", encoding="utf-8") as f:
        json.dump(chats, f, indent=2, ensure_ascii=False)

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

@app.delete("/chat/{chat_id}")
def delete_chat(chat_id: int):
    chats = read_chats()
    chats = [c for c in chats if c["id"] != chat_id]
    write_chats(chats)
    return {"ok": True}

@app.websocket("/ws")
async def websocket_chat(ws: WebSocket):
    await ws.accept()
    while True:
        data = await ws.receive_json()
        question = data["question"]
        answer = f"Hai scritto: {question}"
        await ws.send_text(answer)
        await ws.send_text("__END__")


# =========================================================
# INDICI
# =========================================================

class IndexCreate(BaseModel):
    name: str

@app.get("/indexes")
def get_indexes():
    return list_indexes()

@app.post("/create-index")
def api_create_index(data: IndexCreate):
    return {"ok": create_index(data.name)}

@app.delete("/index/{index_name}")
def remove_index(index_name: str):
    return {"ok": delete_index(index_name)}

@app.get("/files/{index_name}")
def get_files(index_name: str):
    return list_files(index_name)

@app.post("/upload-file/{index_name}")
async def upload_file(index_name: str, file: UploadFile = File(...)):
    index_path = os.path.join("data", "indexes", index_name, "files")

    if not os.path.exists(index_path):
        return {"ok": False}

    os.makedirs(index_path, exist_ok=True)

    final_path = os.path.join(index_path, file.filename)

    with open(final_path, "wb") as f:
        f.write(await file.read())

    # ricostruisce chunks
    from rag import rebuild_chunks
    rebuild_chunks(index_name)

    return {"ok": True, "files": list_files(index_name)}


@app.delete("/file/{index_name}/{filename}")
def remove_file(index_name: str, filename: str):
    ok = delete_file_from_index(index_name, filename)
    return {"ok": ok, "files": list_files(index_name)}


# =========================================================
# DOWNLOAD FILE
# =========================================================

@app.get("/download/{index_name}/{filename}")
def download_file(index_name: str, filename: str):
    file_path = os.path.join("data", "indexes", index_name, "files", filename)

    if not os.path.exists(file_path):
        return {"error": "File non trovato"}

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )
    
# =========================================================
# READ FILE CONTENT
# =========================================================

@app.get("/file-content/{index_name}/{filename}")
def read_file_content(index_name: str, filename: str):
    file_path = os.path.join("data", "indexes", index_name, "files", filename)

    if not os.path.exists(file_path):
        return {"error": "File non trovato"}

    try:
        # ===== TXT =====
        if filename.lower().endswith(".txt"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return {"content": content}

        # ===== PDF =====
        elif filename.lower().endswith(".pdf"):
            doc = fitz.open(file_path)
            full_text = ""

            for page in doc:
                page_text = page.get_text("text")
                page_text = page_text.replace("\n", " ")
                page_text = " ".join(page_text.split())
                full_text += page_text + "\n\n"

            doc.close()

            return {"content": full_text}

        else:
            return {"error": "Formato non supportato"}

    except Exception as e:
        return {"error": f"Errore lettura file: {str(e)}"}



# =========================================================
# SEARCH FILES + SALVATAGGIO CHAT
# =========================================================

class SearchRequest(BaseModel):
    index: str
    question: str

@app.get("/index-chat/{index_name}")
def get_index_chat(index_name: str):
    return load_index_chat(index_name)

@app.post("/search-files")
def search_files(data: SearchRequest):

    # carico chat esistente
    messages = load_index_chat(data.index)

    # aggiungo messaggio utente
    messages.append({
        "role": "user",
        "text": data.question
    })

    matched_files = retrieve_docs(data.question, data.index)

    # SE NON TROVA NULLA
    if not matched_files:
        bot_message = {
            "role": "bot",
            "text": f'"{data.question}" non è presente in nessun file.',
            "files": [],
            "query": data.question
        }
    else:
        bot_message = {
            "role": "bot",
            "text": f'Ecco i file in base a "{data.question}"',
            "files": [],
            "query": data.question
        }

        for f in matched_files:
            bot_message["files"].append({
                "filename": f,
                "download_url": f"http://127.0.0.1:8000/download/{data.index}/{f}"
            })

    messages.append(bot_message)

    save_index_chat(data.index, messages)

    return messages
