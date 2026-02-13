import os
import json
import shutil

INDEX_ROOT = "data/indexes"
CHUNK_SIZE = 500

os.makedirs(INDEX_ROOT, exist_ok=True)


# ===== INDICI =====

def list_indexes():
    return sorted([
        d for d in os.listdir(INDEX_ROOT)
        if os.path.isdir(os.path.join(INDEX_ROOT, d))
    ])


def create_index(name: str):
    name = name.strip()
    if not name:
        return False

    index_path = os.path.join(INDEX_ROOT, name)
    if os.path.exists(index_path):
        return False

    os.makedirs(os.path.join(index_path, "files"), exist_ok=True)

    with open(os.path.join(index_path, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump([], f)

    with open(os.path.join(index_path, "chat.json"), "w", encoding="utf-8") as f:
        json.dump([], f)

    return True


def delete_index(index_name: str):
    path = os.path.join(INDEX_ROOT, index_name)
    if not os.path.exists(path):
        return False
    shutil.rmtree(path)
    return True


# ===== FILE =====

def add_file_to_index(temp_file_path: str, index_name: str):
    index_path = os.path.join(INDEX_ROOT, index_name)
    if not os.path.exists(index_path):
        return False

    files_dir = os.path.join(index_path, "files")
    os.makedirs(files_dir, exist_ok=True)

    filename = os.path.basename(temp_file_path)
    final_path = os.path.join(files_dir, filename)
    shutil.move(temp_file_path, final_path)

    rebuild_chunks(index_name)

    return True


def delete_file_from_index(index_name: str, filename: str):
    file_path = os.path.join(INDEX_ROOT, index_name, "files", filename)
    if not os.path.exists(file_path):
        return False

    os.remove(file_path)
    rebuild_chunks(index_name)
    return True


def rebuild_chunks(index_name):
    index_path = os.path.join(INDEX_ROOT, index_name)
    files_dir = os.path.join(index_path, "files")
    chunks_path = os.path.join(index_path, "chunks.json")

    all_chunks = []

    for fname in os.listdir(files_dir):
        if fname.lower().endswith(".txt"):
            with open(os.path.join(files_dir, fname), "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

            chunks = [
                text[i:i + CHUNK_SIZE]
                for i in range(0, len(text), CHUNK_SIZE)
                if text[i:i + CHUNK_SIZE].strip()
            ]

            for chunk in chunks:
                all_chunks.append({
                    "file": fname,
                    "text": chunk
                })

    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)


def list_files(index_name: str):
    files_dir = os.path.join(INDEX_ROOT, index_name, "files")
    if not os.path.exists(files_dir):
        return []
    return sorted(os.listdir(files_dir))


# ===== CHAT INDICE =====

def get_chat_path(index_name: str):
    return os.path.join(INDEX_ROOT, index_name, "chat.json")


def load_index_chat(index_name: str):
    path = get_chat_path(index_name)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_index_chat(index_name: str, messages):
    path = get_chat_path(index_name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(messages, f, indent=2, ensure_ascii=False)


# ===== RAG MODIFICATO =====

def retrieve_docs(question: str, index_name: str):
    chunks_path = os.path.join(INDEX_ROOT, index_name, "chunks.json")
    if not os.path.exists(chunks_path):
        return []

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    words = question.lower().split()
    matched_files = set()

    for chunk in chunks:
        text = chunk["text"].lower()

        for w in words:
            if w in text:
                matched_files.add(chunk["file"])
                break

    return list(matched_files)
